import type { TrendingToken, TrendingResponse, TokenLookup } from "../shared/types.ts";
import { getActiveBoosts, getActiveBoostCountFor } from "./db.ts";

const GT_TRENDING_URL =
  "https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?include=base_token&page=1";
const DS_TOKEN_URL = "https://api.dexscreener.com/latest/dex/tokens/";

/* ----------------------------------- helpers ----------------------------------- */

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function baseScore(t: { volume24h: number; txns24h: number; change24h: number; liquidityUsd: number }): number {
  return (
    5 +
    Math.log10(t.volume24h + 10) * 3 +
    Math.log10(t.txns24h + 1) * 2 +
    Math.max(-50, Math.min(150, t.change24h)) / 30 +
    Math.log10(t.liquidityUsd + 10)
  );
}

/** Paid boosts multiply a token's trending score — same model as the big screeners. */
function boostFactor(activeBoosts: number): number {
  return 1 + activeBoosts * 0.15;
}

/* ------------------------------ GeckoTerminal feed ----------------------------- */

interface RawToken {
  address: string;
  pairAddress: string | null;
  name: string;
  symbol: string;
  imageUrl: string | null;
  chain: string;
  priceUsd: number;
  change5m: number;
  change1h: number;
  change6h: number;
  change24h: number;
  volume24h: number;
  txns24h: number;
  liquidityUsd: number;
  marketCapUsd: number;
  isDemo?: boolean;
}

async function fetchTrendingFromGecko(): Promise<RawToken[]> {
  const r = await fetch(GT_TRENDING_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`gecko ${r.status}`);
  const j = (await r.json()) as {
    data?: Array<{
      attributes?: Record<string, any>;
      relationships?: { base_token?: { data?: { id?: string } } };
    }>;
    included?: Array<{ id?: string; attributes?: Record<string, any> }>;
  };

  const tokenInfo = new Map<string, { address: string; name: string; symbol: string; image: string | null }>();
  for (const inc of j.included ?? []) {
    const a = inc.attributes ?? {};
    if (inc.id && a.address) {
      tokenInfo.set(inc.id, {
        address: String(a.address),
        name: String(a.name ?? a.symbol ?? "Unknown"),
        symbol: String(a.symbol ?? "???"),
        image: a.image_url && a.image_url !== "missing.png" ? String(a.image_url) : null,
      });
    }
  }

  const out: RawToken[] = [];
  const seen = new Set<string>();
  for (const pool of j.data ?? []) {
    const a = pool.attributes ?? {};
    const baseId = pool.relationships?.base_token?.data?.id;
    const info = baseId ? tokenInfo.get(baseId) : undefined;
    const address = info?.address ?? (baseId ? baseId.replace(/^solana_/, "") : null);
    if (!address || seen.has(address)) continue;
    seen.add(address);

    const tx24 = a.transactions?.h24 ?? {};
    out.push({
      address,
      pairAddress: a.address ? String(a.address) : null,
      name: info?.name ?? String(a.name ?? "Unknown").split("/")[0].trim(),
      symbol: info?.symbol ?? String(a.name ?? "???").split("/")[0].trim(),
      imageUrl: info?.image ?? null,
      chain: "solana",
      priceUsd: num(a.base_token_price_usd),
      change5m: num(a.price_change_percentage?.m5),
      change1h: num(a.price_change_percentage?.h1),
      change6h: num(a.price_change_percentage?.h6),
      change24h: num(a.price_change_percentage?.h24),
      volume24h: num(a.volume_usd?.h24),
      txns24h: num(tx24.buys) + num(tx24.sells),
      liquidityUsd: num(a.reserve_in_usd),
      marketCapUsd: num(a.market_cap_usd) || num(a.fdv_usd),
    });
  }
  return out;
}

/* ----------------------------- DexScreener token lookup ------------------------ */

const lookupCache = new Map<string, { data: RawToken | null; fetchedAt: number }>();

export async function lookupTokenRaw(address: string): Promise<RawToken | null> {
  const cached = lookupCache.get(address);
  if (cached && Date.now() - cached.fetchedAt < 5 * 60_000) return cached.data;

  let data: RawToken | null = null;
  try {
    const r = await fetch(DS_TOKEN_URL + encodeURIComponent(address), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const j = (await r.json()) as { pairs?: Array<Record<string, any>> };
      const pairs = (j.pairs ?? []).filter((p) => p?.baseToken?.address);
      pairs.sort((a, b) => num(b.liquidity?.usd) - num(a.liquidity?.usd));
      const best = pairs.find((p) => p.chainId === "solana") ?? pairs[0];
      if (best) {
        const tx24 = best.txns?.h24 ?? {};
        data = {
          address,
          pairAddress: best.pairAddress ?? null,
          name: String(best.baseToken.name ?? "Unknown"),
          symbol: String(best.baseToken.symbol ?? "???"),
          imageUrl: best.info?.imageUrl ?? null,
          chain: String(best.chainId ?? "solana"),
          priceUsd: num(best.priceUsd),
          change5m: num(best.priceChange?.m5),
          change1h: num(best.priceChange?.h1),
          change6h: num(best.priceChange?.h6),
          change24h: num(best.priceChange?.h24),
          volume24h: num(best.volume?.h24),
          txns24h: num(tx24.buys) + num(tx24.sells),
          liquidityUsd: num(best.liquidity?.usd),
          marketCapUsd: num(best.marketCap) || num(best.fdv),
        };
      }
    }
  } catch {
    // network down or token unknown — caller handles null
  }
  lookupCache.set(address, { data, fetchedAt: Date.now() });
  return data;
}

export async function lookupToken(address: string): Promise<TokenLookup> {
  const raw = await lookupTokenRaw(address);
  const activeBoosts = getActiveBoostCountFor(address, Date.now());
  if (!raw) {
    return {
      found: false,
      address,
      name: "Unknown token",
      symbol: address.slice(0, 4) + "…" + address.slice(-4),
      imageUrl: null,
      priceUsd: null,
      marketCapUsd: null,
      liquidityUsd: null,
      volume24h: null,
      change24h: null,
      pairAddress: null,
      chain: "solana",
      activeBoosts,
    };
  }
  return {
    found: true,
    address,
    name: raw.name,
    symbol: raw.symbol,
    imageUrl: raw.imageUrl,
    priceUsd: raw.priceUsd,
    marketCapUsd: raw.marketCapUsd,
    liquidityUsd: raw.liquidityUsd,
    volume24h: raw.volume24h,
    change24h: raw.change24h,
    pairAddress: raw.pairAddress,
    chain: raw.chain,
    activeBoosts,
  };
}

/* --------------------------------- demo fallback ------------------------------- */
// Shown only when the live market APIs are unreachable, flagged `isDemo` so the
// UI labels it clearly. Keeps the screener visually alive in dev/offline mode.

const DEMO_TOKENS: RawToken[] = [
  ["DemoWIFdog111111111111111111111111111111111", "dogwifhat", "WIF", 2.41, 4.2, 12.7, 31.5, 48.2, 48_200_000, 88_000, 9_400_000, 2_400_000_000],
  ["DemoBONK111111111111111111111111111111111111", "Bonk", "BONK", 0.0000312, 1.1, -2.3, 8.9, 14.2, 31_000_000, 64_000, 7_800_000, 2_100_000_000],
  ["DemoPOPCAT11111111111111111111111111111111", "Popcat", "POPCAT", 1.38, -0.8, 5.4, 18.2, 22.9, 19_500_000, 41_000, 5_600_000, 1_350_000_000],
  ["DemoPNUT111111111111111111111111111111111111", "Peanut the Squirrel", "PNUT", 1.12, 2.4, 9.8, 26.1, 67.4, 28_700_000, 57_000, 4_100_000, 1_120_000_000],
  ["DemoMOODENG11111111111111111111111111111111", "Moo Deng", "MOODENG", 0.412, 8.1, 22.5, 41.2, 96.8, 22_300_000, 52_000, 2_900_000, 408_000_000],
  ["DemoGOAT111111111111111111111111111111111111", "Goatseus Maximus", "GOAT", 0.71, -1.4, 3.2, 11.8, 19.5, 14_800_000, 33_000, 3_300_000, 710_000_000],
  ["DemoCHILLGUY1111111111111111111111111111111", "Just a Chill Guy", "CHILLGUY", 0.182, 5.6, 14.2, 38.7, 124.6, 18_900_000, 47_000, 1_800_000, 182_000_000],
  ["DemoFWOG111111111111111111111111111111111111", "FWOG", "FWOG", 0.094, -2.1, -6.8, 4.2, 9.1, 6_400_000, 19_000, 1_200_000, 94_000_000],
  ["DemoMICHI11111111111111111111111111111111111", "michi", "MICHI", 0.21, 0.4, 2.1, 7.4, 12.8, 4_900_000, 14_000, 980_000, 210_000_000],
  ["DemoGIGA111111111111111111111111111111111111", "Gigachad", "GIGA", 0.061, 3.8, 8.4, 16.9, 28.4, 7_700_000, 22_000, 1_500_000, 580_000_000],
  ["DemoRETARDIO111111111111111111111111111111", "Retardio", "RETARDIO", 0.084, -4.2, -8.1, -2.4, 6.2, 2_100_000, 8_000, 740_000, 84_000_000],
  ["DemoSIGMA11111111111111111111111111111111111", "Sigma", "SIGMA", 0.048, 1.9, 6.2, 13.1, 21.7, 3_300_000, 11_000, 620_000, 48_000_000],
].map(([address, name, symbol, price, m5, h1, h6, h24, vol, tx, liq, mc]) => ({
  address: address as string,
  pairAddress: null,
  name: name as string,
  symbol: symbol as string,
  imageUrl: null,
  chain: "solana",
  priceUsd: price as number,
  change5m: m5 as number,
  change1h: h1 as number,
  change6h: h6 as number,
  change24h: h24 as number,
  volume24h: vol as number,
  txns24h: tx as number,
  liquidityUsd: liq as number,
  marketCapUsd: mc as number,
  isDemo: true,
}));

/* ------------------------------- trending assembly ----------------------------- */

let trendingCache: { tokens: RawToken[]; fetchedAt: number; live: boolean } = {
  tokens: [],
  fetchedAt: 0,
  live: false,
};

async function getBaseTrending(): Promise<{ tokens: RawToken[]; live: boolean }> {
  const now = Date.now();
  if (now - trendingCache.fetchedAt < 60_000 && trendingCache.tokens.length > 0) {
    return { tokens: trendingCache.tokens, live: trendingCache.live };
  }
  try {
    const tokens = await fetchTrendingFromGecko();
    if (tokens.length > 0) {
      trendingCache = { tokens, fetchedAt: now, live: true };
      return { tokens, live: true };
    }
  } catch {
    // fall through to stale/demo
  }
  if (trendingCache.tokens.length > 0) {
    trendingCache.fetchedAt = now - 45_000; // retry soon
    return { tokens: trendingCache.tokens, live: trendingCache.live };
  }
  return { tokens: DEMO_TOKENS, live: false };
}

/**
 * The trending board. Base ranking comes from live market data; active paid
 * boosts multiply a token's score (and boosted tokens that aren't already
 * trending get injected). Boosted rows carry their ⚡ count so the UI always
 * discloses paid placement.
 */
export async function getTrending(): Promise<TrendingResponse> {
  const now = Date.now();
  const { tokens: base, live } = await getBaseTrending();
  const boosts = getActiveBoosts(now);

  const boostTotals = new Map<string, number>();
  const boostMeta = new Map<string, { symbol: string | null; name: string | null; image: string | null }>();
  for (const b of boosts) {
    boostTotals.set(b.token_address, (boostTotals.get(b.token_address) ?? 0) + b.boosts);
    if (!boostMeta.has(b.token_address)) {
      boostMeta.set(b.token_address, { symbol: b.token_symbol, name: b.token_name, image: b.token_image });
    }
  }

  const rows: RawToken[] = [...base];
  const present = new Set(base.map((t) => t.address));

  // Inject boosted tokens that aren't in the base feed.
  for (const [address] of boostTotals) {
    if (present.has(address)) continue;
    const fetched = await lookupTokenRaw(address);
    if (fetched) {
      rows.push(fetched);
    } else {
      const meta = boostMeta.get(address);
      rows.push({
        address,
        pairAddress: null,
        name: meta?.name ?? "Boosted token",
        symbol: meta?.symbol ?? address.slice(0, 4) + "…",
        imageUrl: meta?.image ?? null,
        chain: "solana",
        priceUsd: 0,
        change5m: 0,
        change1h: 0,
        change6h: 0,
        change24h: 0,
        volume24h: 0,
        txns24h: 0,
        liquidityUsd: 0,
        marketCapUsd: 0,
      });
    }
    present.add(address);
  }

  const scored: TrendingToken[] = rows.map((t) => {
    const active = boostTotals.get(t.address) ?? 0;
    const score = baseScore(t) * boostFactor(active);
    return {
      rank: 0,
      address: t.address,
      pairAddress: t.pairAddress,
      name: t.name,
      symbol: t.symbol,
      imageUrl: t.imageUrl,
      chain: t.chain,
      priceUsd: t.priceUsd,
      change5m: t.change5m,
      change1h: t.change1h,
      change6h: t.change6h,
      change24h: t.change24h,
      volume24h: t.volume24h,
      txns24h: t.txns24h,
      liquidityUsd: t.liquidityUsd,
      marketCapUsd: t.marketCapUsd,
      score,
      activeBoosts: active,
      golden: active >= 500,
      isDemo: t.isDemo,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((t, i) => (t.rank = i + 1));

  return { tokens: scored, updatedAt: now, live };
}
