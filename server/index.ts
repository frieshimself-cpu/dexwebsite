import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { CONFIG, BOOST_PACKAGES, PUMP_FUN_URL, getPackage } from "./config.ts";
import {
  newId,
  insertOrder,
  getOrder,
  getActiveAds,
  getStats,
  getAllOrders,
  getActiveBoostCountFor,
  type OrderRow,
} from "./db.ts";
import { getSolPriceUsd, quotePayment, pollPayments, quickCheckOrder, verifyOrderBySignature } from "./solana.ts";
import { getTrending, lookupToken } from "./marketdata.ts";
import type { OrderPublic, SiteConfig } from "../shared/types.ts";

const app = express();
app.use(cors());
app.use(express.json({ limit: "64kb" }));

/* ------------------------------ tiny rate limiter ------------------------------ */

const hits = new Map<string, { n: number; resetAt: number }>();
function rateLimit(max: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.resetAt < now) {
      hits.set(key, { n: 1, resetAt: now + windowMs });
      return next();
    }
    if (++h.n > max) return res.status(429).json({ error: "Slow down, rocketeer." });
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
}, 60_000).unref();

/* ----------------------------------- helpers ----------------------------------- */

const isSolanaAddress = (s: unknown): s is string =>
  typeof s === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);

function toPublicOrder(o: OrderRow): OrderPublic {
  return {
    id: o.id,
    type: o.type,
    status: o.status,
    tokenAddress: o.token_address,
    tokenSymbol: o.token_symbol,
    boosts: o.boosts,
    adDays: o.ad_days,
    usd: o.usd,
    payment: {
      recipient: CONFIG.receiveWallet,
      amountSol: o.amount_lamports / 1e9,
      amountLamports: o.amount_lamports,
      reference: o.reference,
      solanaPayUrl: buildPayUrl(o),
      expiresAt: o.expires_at,
    },
    signature: o.signature,
    createdAt: o.created_at,
  };
}

function buildPayUrl(o: OrderRow): string {
  const amount = (o.amount_lamports / 1e9).toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
  const message =
    o.type === "boost"
      ? `MemeRocket ${o.boosts}x boost for ${o.token_symbol ?? o.token_address.slice(0, 6)}`
      : `MemeRocket ad banner (${o.ad_days}d)`;
  const params = new URLSearchParams({ amount, reference: o.reference, label: "MemeRocket", message });
  return `solana:${CONFIG.receiveWallet}?${params.toString()}`;
}

/* ------------------------------------ routes ----------------------------------- */

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get("/api/config", async (_req, res) => {
  const solPriceUsd = await getSolPriceUsd();
  const cfg: SiteConfig = {
    receiveWallet: CONFIG.receiveWallet,
    packages: BOOST_PACKAGES,
    adPricePerDay: CONFIG.adPricePerDay,
    boostDurationHours: CONFIG.boostDurationHours,
    solPriceUsd,
    pumpFunCA: CONFIG.pumpFunCA,
    pumpFunUrl: PUMP_FUN_URL,
  };
  res.json(cfg);
});

app.get("/api/trending", async (_req, res) => {
  try {
    res.json(await getTrending());
  } catch (e) {
    res.status(500).json({ error: "trending unavailable" });
  }
});

app.get("/api/token/:address", async (req, res) => {
  const { address } = req.params;
  if (!isSolanaAddress(address)) return res.status(400).json({ error: "Invalid Solana address" });
  res.json(await lookupToken(address));
});

app.get("/api/ads/active", (_req, res) => {
  const ads = getActiveAds(Date.now()).map((a) => ({
    id: a.id,
    name: a.name,
    imageUrl: a.image_url,
    linkUrl: a.link_url,
    expiresAt: a.expires_at,
  }));
  res.json({ ads });
});

app.get("/api/stats", (_req, res) => res.json(getStats()));

const isHttpUrl = (s: unknown): s is string =>
  typeof s === "string" && /^https?:\/\/.{3,500}$/.test(s);

app.post("/api/orders", rateLimit(10, 60_000), async (req, res) => {
  try {
    const { type, tokenAddress } = req.body ?? {};
    if (type !== "boost" && type !== "ad") return res.status(400).json({ error: "Invalid order type" });
    if (!isSolanaAddress(tokenAddress)) return res.status(400).json({ error: "Invalid token address" });

    let usd = 0;
    let boosts: number | null = null;
    let packageId: string | null = null;
    let adDays: number | null = null;
    let adImageUrl: string | null = null;
    let adLinkUrl: string | null = null;

    if (type === "boost") {
      const pkg = getPackage(String(req.body.packageId ?? ""));
      if (!pkg) return res.status(400).json({ error: "Unknown boost package" });
      usd = pkg.usd;
      boosts = pkg.boosts;
      packageId = pkg.id;
    } else {
      const days = Math.floor(Number(req.body.adDays));
      if (!Number.isFinite(days) || days < 1 || days > 30)
        return res.status(400).json({ error: "Ad duration must be 1-30 days" });
      if (!isHttpUrl(req.body.adImageUrl)) return res.status(400).json({ error: "Ad image must be a valid URL" });
      if (!isHttpUrl(req.body.adLinkUrl)) return res.status(400).json({ error: "Ad link must be a valid URL" });
      adDays = days;
      adImageUrl = req.body.adImageUrl;
      adLinkUrl = req.body.adLinkUrl;
      usd = days * CONFIG.adPricePerDay;
    }

    // Enrich with token metadata so the boost badge has a name/logo even if
    // market APIs are down later.
    const token = await lookupToken(tokenAddress);

    const label =
      type === "boost"
        ? `MemeRocket ${boosts}x boost for ${token.symbol}`
        : `MemeRocket ad banner (${adDays}d)`;
    const quote = await quotePayment(usd, label);

    const now = Date.now();
    const order: OrderRow = {
      id: newId(),
      type,
      status: "pending",
      token_address: tokenAddress,
      token_symbol: token.symbol,
      token_name: token.name,
      token_image: token.imageUrl,
      package_id: packageId,
      boosts,
      ad_days: adDays,
      ad_image_url: adImageUrl,
      ad_link_url: adLinkUrl,
      usd,
      amount_lamports: quote.amountLamports,
      reference: quote.reference,
      signature: null,
      created_at: now,
      expires_at: now + CONFIG.orderTtlMinutes * 60_000,
      paid_at: null,
    };
    insertOrder(order);
    res.json({ order: toPublicOrder(order) });
  } catch (e) {
    console.error("[orders] create failed:", e);
    res.status(500).json({ error: "Could not create order" });
  }
});

const lastQuickCheck = new Map<string, number>();
app.get("/api/orders/:id", async (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  // Piggyback a throttled on-chain check on status polls for snappy UX.
  if (order.status === "pending") {
    const last = lastQuickCheck.get(order.id) ?? 0;
    if (Date.now() - last > 8000) {
      lastQuickCheck.set(order.id, Date.now());
      await quickCheckOrder(order).catch(() => {});
    }
  }
  const fresh = getOrder(order.id)!;
  res.json({ order: toPublicOrder(fresh) });
});

app.post("/api/orders/:id/verify", rateLimit(12, 60_000), async (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "paid") return res.json({ order: toPublicOrder(order) });
  if (order.status === "expired") return res.status(410).json({ error: "Order expired — start a new one" });

  const signature = String(req.body?.signature ?? "").trim();
  if (!signature) return res.status(400).json({ error: "Paste the transaction signature" });

  const ok = await verifyOrderBySignature(order, signature);
  if (!ok)
    return res.status(400).json({
      error: "Couldn't verify that signature — check it sent the exact SOL amount to the right wallet, then try again in ~30s.",
    });
  res.json({ order: toPublicOrder(getOrder(order.id)!) });
});

/* ------------------------------------ admin ------------------------------------ */

app.get("/api/admin/orders", (req, res) => {
  if (!CONFIG.adminKey || req.headers["x-admin-key"] !== CONFIG.adminKey)
    return res.status(401).json({ error: "unauthorized" });
  res.json({ orders: getAllOrders() });
});

/* -------------------------------- static frontend ------------------------------ */

const DIST = path.resolve(process.cwd(), "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(DIST, "index.html")));
}

/* ---------------------------------- background ---------------------------------- */

setInterval(() => {
  pollPayments().catch((e) => console.error("[pay] poll error:", e));
}, 25_000).unref();

app.listen(CONFIG.port, () => {
  console.log(`🚀 MemeRocket server on http://localhost:${CONFIG.port}`);
  console.log(`   receive wallet: ${CONFIG.receiveWallet}`);
  console.log(`   rpc: ${CONFIG.rpcUrl}`);
});
