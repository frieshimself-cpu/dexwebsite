import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { CONFIG } from "./config.ts";
import {
  getVerifiableOrders,
  expireStaleOrders,
  settleOrder,
  signatureUsed,
  lamportsAmountInUse,
  type OrderRow,
} from "./db.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GRACE_MS = CONFIG.orderGraceHours * 3600_000;

const connection = new Connection(CONFIG.rpcUrl, "confirmed");
const recipient = new PublicKey(CONFIG.receiveWallet);

/* ---------------------------------- SOL price ---------------------------------- */

let solPriceCache = { price: CONFIG.solPriceFallback, fetchedAt: 0, live: false };

export async function getSolPriceUsd(): Promise<number> {
  const now = Date.now();
  if (now - solPriceCache.fetchedAt < 5 * 60_000) return solPriceCache.price;

  const sources: Array<() => Promise<number>> = [
    async () => {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
        signal: AbortSignal.timeout(6000),
      });
      const j = (await r.json()) as { solana?: { usd?: number } };
      const p = j.solana?.usd;
      if (!p || p <= 0) throw new Error("no price");
      return p;
    },
    async () => {
      const r = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", {
        signal: AbortSignal.timeout(6000),
      });
      const j = (await r.json()) as { data?: { amount?: string } };
      const p = Number(j.data?.amount);
      if (!p || p <= 0) throw new Error("no price");
      return p;
    },
    async () => {
      const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", {
        signal: AbortSignal.timeout(6000),
      });
      const j = (await r.json()) as { price?: string };
      const p = Number(j.price);
      if (!p || p <= 0) throw new Error("no price");
      return p;
    },
  ];

  for (const src of sources) {
    try {
      const price = await src();
      solPriceCache = { price, fetchedAt: now, live: true };
      return price;
    } catch {
      // try next source
    }
  }
  // keep the last known price but retry again in a minute
  solPriceCache.fetchedAt = now - 4 * 60_000;
  return solPriceCache.price;
}

/* ------------------------------- payment creation ------------------------------ */

export interface PaymentQuote {
  amountLamports: number;
  amountSol: number;
  reference: string;
  solanaPayUrl: string;
}

/**
 * Convert USD to lamports and add a tiny unique "dust" suffix so every pending
 * order has a distinct on-chain amount. That lets us credit plain wallet
 * transfers (no reference) by matching the exact amount received.
 */
export async function quotePayment(usd: number, label: string): Promise<PaymentQuote> {
  const price = await getSolPriceUsd();
  let lamports = Math.round((usd / price) * LAMPORTS_PER_SOL);
  // Round to a clean 10k-lamport boundary, then add unique "dust"
  // (1k..999k lamports = 0.000001..0.000999 SOL) so each pending order has a
  // distinct on-chain amount. Random first, then a deterministic sweep so a
  // collision can never silently produce a duplicate amount.
  lamports = Math.ceil(lamports / 10_000) * 10_000;
  const start = Math.floor(Math.random() * 999) + 1;
  for (let i = 0; i < 999; i++) {
    const dust = (((start + i) % 999) + 1) * 1_000;
    if (!lamportsAmountInUse(lamports + dust)) {
      lamports += dust;
      break;
    }
  }

  // Reference key: a throwaway public key included in the Solana Pay tx so we
  // can find the payment instantly. We never need (or keep) its secret key.
  const reference = Keypair.generate().publicKey.toBase58();
  const amountSol = lamports / LAMPORTS_PER_SOL;

  const params = new URLSearchParams({
    amount: amountSol.toFixed(9).replace(/0+$/, "").replace(/\.$/, ""),
    reference,
    label: "MemeRocket",
    message: label,
  });
  const solanaPayUrl = `solana:${CONFIG.receiveWallet}?${params.toString()}`;

  return { amountLamports: lamports, amountSol, reference, solanaPayUrl };
}

/**
 * Build an unsigned transfer transaction for browser-extension wallets
 * (Phantom/Solflare). Includes the order's reference key so the payment
 * poller can also find it independently.
 */
export async function buildPaymentTx(order: OrderRow, payerAddress: string): Promise<string> {
  const payer = new PublicKey(payerAddress);
  const ix = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: recipient,
    lamports: order.amount_lamports,
  });
  ix.keys.push({ pubkey: new PublicKey(order.reference), isSigner: false, isWritable: false });

  const tx = new Transaction().add(ix);
  tx.feePayer = payer;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
}

/* ------------------------------ payment verification --------------------------- */

function lamportsReceivedBy(tx: ParsedTransactionWithMeta, who: PublicKey): number {
  if (!tx.meta || tx.meta.err) return 0;
  const keys = tx.transaction.message.accountKeys;
  const idx = keys.findIndex((k) => k.pubkey.equals(who));
  if (idx === -1) return 0;
  return (tx.meta.postBalances[idx] ?? 0) - (tx.meta.preBalances[idx] ?? 0);
}

async function getParsedTx(signature: string): Promise<ParsedTransactionWithMeta | null> {
  try {
    return await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  } catch {
    return null;
  }
}

/** Check the order's Solana Pay reference key for an incoming payment. */
async function verifyByReference(order: OrderRow): Promise<string | null> {
  try {
    const ref = new PublicKey(order.reference);
    const sigs = await connection.getSignaturesForAddress(ref, { limit: 5 });
    for (const s of sigs) {
      if (s.err) continue;
      if (signatureUsed(s.signature)) continue;
      const tx = await getParsedTx(s.signature);
      if (!tx) continue;
      const received = lamportsReceivedBy(tx, recipient);
      // allow 1% under in case a wallet rounds the display amount
      if (received >= order.amount_lamports * 0.99) return s.signature;
    }
  } catch {
    // RPC hiccup — next poll will retry
  }
  return null;
}

/** Manual fallback: the payer pastes their tx signature. */
export async function verifyOrderBySignature(order: OrderRow, signature: string): Promise<boolean> {
  if (!/^[1-9A-HJ-NP-Za-km-z]{60,100}$/.test(signature)) return false;
  if (signatureUsed(signature)) return false;
  const tx = await getParsedTx(signature);
  if (!tx) return false;
  const received = lamportsReceivedBy(tx, recipient);
  if (received < order.amount_lamports * 0.99) return false;
  settleOrder(order, signature, Date.now(), CONFIG.boostDurationHours);
  return true;
}

/**
 * Safety net for people who plain-send SOL from any wallet without the
 * reference: scan recent transfers into the receive wallet and match the
 * unique lamport amounts of pending orders. Uses one batched RPC call for
 * all transactions instead of one per signature.
 */
async function scanRecipientForPending(pending: OrderRow[]): Promise<void> {
  if (pending.length === 0) return;
  const byAmount = new Map<number, OrderRow>();
  for (const o of pending) byAmount.set(o.amount_lamports, o);

  try {
    const sigs = (await connection.getSignaturesForAddress(recipient, { limit: 20 })).filter(
      (s) => !s.err && !signatureUsed(s.signature)
    );
    if (sigs.length === 0) return;
    const txs = await connection.getParsedTransactions(
      sigs.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0, commitment: "confirmed" }
    );
    txs.forEach((tx, i) => {
      if (!tx) return;
      const received = lamportsReceivedBy(tx, recipient);
      const order = byAmount.get(received);
      if (order && order.status === "pending") {
        settleOrder(order, sigs[i].signature, Date.now(), CONFIG.boostDurationHours);
        byAmount.delete(received);
        console.log(`[pay] settled order ${order.id} via amount-match (${received} lamports)`);
      }
    });
  } catch {
    // RPC hiccup — next poll will retry
  }
}

let polling = false;

/** Runs on an interval: expire stale orders, then look for payments. */
export async function pollPayments(): Promise<void> {
  if (polling) return;
  polling = true;
  try {
    const now = Date.now();
    expireStaleOrders(now, GRACE_MS);
    const pending = getVerifiableOrders(now, GRACE_MS);
    for (const order of pending) {
      const sig = await verifyByReference(order);
      if (sig) {
        settleOrder(order, sig, Date.now(), CONFIG.boostDurationHours);
        console.log(`[pay] settled order ${order.id} via reference (${sig.slice(0, 16)}…)`);
      }
      await sleep(250); // be gentle with rate-limited RPCs
    }
    await scanRecipientForPending(getVerifiableOrders(Date.now(), GRACE_MS));
  } finally {
    polling = false;
  }
}

/** One quick reference check, used when the client polls an order's status. */
export async function quickCheckOrder(order: OrderRow): Promise<boolean> {
  if (order.status !== "pending") return order.status === "paid";
  const sig = await verifyByReference(order);
  if (sig) {
    settleOrder(order, sig, Date.now(), CONFIG.boostDurationHours);
    return true;
  }
  return false;
}
