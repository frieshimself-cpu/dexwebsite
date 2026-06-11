import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { OrderStatus, OrderType } from "../shared/types.ts";

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "memerocket.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  token_name TEXT,
  token_image TEXT,
  package_id TEXT,
  boosts INTEGER,
  ad_days INTEGER,
  ad_image_url TEXT,
  ad_link_url TEXT,
  usd REAL NOT NULL,
  amount_lamports INTEGER NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  signature TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  paid_at INTEGER
);

CREATE TABLE IF NOT EXISTS boosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  token_name TEXT,
  token_image TEXT,
  boosts INTEGER NOT NULL,
  golden INTEGER NOT NULL DEFAULT 0,
  activated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_boosts_token ON boosts(token_address);
CREATE INDEX IF NOT EXISTS idx_boosts_expiry ON boosts(expires_at);

CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  activated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
`);

export interface OrderRow {
  id: string;
  type: OrderType;
  status: OrderStatus;
  token_address: string;
  token_symbol: string | null;
  token_name: string | null;
  token_image: string | null;
  package_id: string | null;
  boosts: number | null;
  ad_days: number | null;
  ad_image_url: string | null;
  ad_link_url: string | null;
  usd: number;
  amount_lamports: number;
  reference: string;
  signature: string | null;
  created_at: number;
  expires_at: number;
  paid_at: number | null;
}

export interface BoostRow {
  id: number;
  order_id: string;
  token_address: string;
  token_symbol: string | null;
  token_name: string | null;
  token_image: string | null;
  boosts: number;
  golden: number;
  activated_at: number;
  expires_at: number;
}

export interface AdRow {
  id: number;
  order_id: string;
  name: string;
  image_url: string;
  link_url: string;
  activated_at: number;
  expires_at: number;
}

export function newId(): string {
  return crypto.randomBytes(10).toString("hex");
}

export function insertOrder(o: OrderRow): void {
  db.prepare(
    `INSERT INTO orders (id, type, status, token_address, token_symbol, token_name, token_image,
      package_id, boosts, ad_days, ad_image_url, ad_link_url, usd, amount_lamports, reference,
      signature, created_at, expires_at, paid_at)
     VALUES (@id, @type, @status, @token_address, @token_symbol, @token_name, @token_image,
      @package_id, @boosts, @ad_days, @ad_image_url, @ad_link_url, @usd, @amount_lamports, @reference,
      @signature, @created_at, @expires_at, @paid_at)`
  ).run(o as unknown as Record<string, unknown>);
}

export function getOrder(id: string): OrderRow | undefined {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
}

export function getPendingOrders(): OrderRow[] {
  return db
    .prepare("SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC")
    .all() as OrderRow[];
}

export function lamportsAmountInUse(lamports: number): boolean {
  const row = db
    .prepare("SELECT 1 FROM orders WHERE amount_lamports = ? AND status = 'pending'")
    .get(lamports);
  return !!row;
}

export function signatureUsed(signature: string): boolean {
  const row = db.prepare("SELECT 1 FROM orders WHERE signature = ?").get(signature);
  return !!row;
}

/** Orders flip to 'expired' only after the quote TTL plus a grace window. */
export function expireStaleOrders(now: number, graceMs: number): void {
  db.prepare("UPDATE orders SET status = 'expired' WHERE status = 'pending' AND expires_at + ? < ?").run(graceMs, now);
}

/** Pending orders that are still worth checking the chain for. */
export function getVerifiableOrders(now: number, graceMs: number): OrderRow[] {
  return db
    .prepare("SELECT * FROM orders WHERE status = 'pending' AND expires_at + ? > ? ORDER BY created_at ASC")
    .all(graceMs, now) as OrderRow[];
}

/**
 * Mark paid + activate the boost or ad, atomically. Also settles 'expired'
 * orders — if the money verifiably arrived, the purchase is honored.
 */
export function settleOrder(order: OrderRow, signature: string, now: number, boostDurationHours: number): void {
  const tx = db.transaction(() => {
    const res = db
      .prepare(
        "UPDATE orders SET status = 'paid', signature = ?, paid_at = ? WHERE id = ? AND status IN ('pending', 'expired')"
      )
      .run(signature, now, order.id);
    if (res.changes === 0) return; // already settled by another path

    if (order.type === "boost" && order.boosts) {
      db.prepare(
        `INSERT INTO boosts (order_id, token_address, token_symbol, token_name, token_image, boosts, golden, activated_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        order.id,
        order.token_address,
        order.token_symbol,
        order.token_name,
        order.token_image,
        order.boosts,
        order.boosts >= 500 ? 1 : 0,
        now,
        now + boostDurationHours * 3600_000
      );
    } else if (order.type === "ad" && order.ad_days && order.ad_image_url && order.ad_link_url) {
      db.prepare(
        `INSERT INTO ads (order_id, name, image_url, link_url, activated_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        order.id,
        order.token_name || order.token_symbol || "Promoted",
        order.ad_image_url,
        order.ad_link_url,
        now,
        now + order.ad_days * 24 * 3600_000
      );
    }
  });
  tx();
}

export function getActiveBoosts(now: number): BoostRow[] {
  return db.prepare("SELECT * FROM boosts WHERE expires_at > ?").all(now) as BoostRow[];
}

export function getActiveBoostCountFor(tokenAddress: string, now: number): number {
  const row = db
    .prepare("SELECT COALESCE(SUM(boosts), 0) AS total FROM boosts WHERE token_address = ? AND expires_at > ?")
    .get(tokenAddress, now) as { total: number };
  return row.total;
}

export function getActiveAds(now: number): AdRow[] {
  return db.prepare("SELECT * FROM ads WHERE expires_at > ? ORDER BY activated_at DESC").all(now) as AdRow[];
}

export function getStats(): { boostsSold: number; tokensBoosted: number; adsRun: number } {
  const boostsSold = (db.prepare("SELECT COALESCE(SUM(boosts),0) AS n FROM boosts").get() as { n: number }).n;
  const tokensBoosted = (db.prepare("SELECT COUNT(DISTINCT token_address) AS n FROM boosts").get() as { n: number }).n;
  const adsRun = (db.prepare("SELECT COUNT(*) AS n FROM ads").get() as { n: number }).n;
  return { boostsSold, tokensBoosted, adsRun };
}

export function getAllOrders(limit = 200): OrderRow[] {
  return db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?").all(limit) as OrderRow[];
}

export function getPaidTotals(): { paidCount: number; pendingCount: number; totalUsd: number; totalLamports: number } {
  const paid = db
    .prepare(
      "SELECT COUNT(*) AS n, COALESCE(SUM(usd),0) AS usd, COALESCE(SUM(amount_lamports),0) AS lamports FROM orders WHERE status = 'paid'"
    )
    .get() as { n: number; usd: number; lamports: number };
  const pending = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'").get() as { n: number };
  return { paidCount: paid.n, pendingCount: pending.n, totalUsd: paid.usd, totalLamports: paid.lamports };
}
