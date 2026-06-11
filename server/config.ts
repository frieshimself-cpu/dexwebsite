import fs from "node:fs";
import path from "node:path";
import type { BoostPackage } from "../shared/types.ts";

// Minimal .env loader — real env vars (e.g. from a host dashboard) win.
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}

export const CONFIG = {
  port: Number(process.env.PORT || 8787),
  rpcUrl: process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
  // PUBLIC address only. Payments are verified on-chain against this wallet.
  receiveWallet:
    process.env.RECEIVE_WALLET || "9MD7xLYTTtSCXLpZYmDkQs5h3ZVLBgwLXay6HBZA9Ktf",
  adminKey: process.env.ADMIN_KEY || "",
  solPriceFallback: Number(process.env.SOL_PRICE_FALLBACK || 150),
  pumpFunCA: "7cpPfNJVj7igL41C2mZmWS9yLHV7rebpcPaLwHZpump",
  boostDurationHours: 24,
  orderTtlMinutes: 60,
  adPricePerDay: 25,
};

export const PUMP_FUN_URL = `https://pump.fun/coin/${CONFIG.pumpFunCA}`;

// Roughly 10x cheaper than the big screeners ($99+ for a 10x there).
export const BOOST_PACKAGES: BoostPackage[] = [
  { id: "boost-10", boosts: 10, usd: 10, label: "Lift-off", tagline: "Dip a toe in the jet fuel" },
  { id: "boost-30", boosts: 30, usd: 30, label: "Ignition", tagline: "Engines running hot" },
  { id: "boost-50", boosts: 50, usd: 50, label: "Max-Q", tagline: "Serious thrust", popular: true },
  { id: "boost-100", boosts: 100, usd: 100, label: "Orbit", tagline: "Top of the board energy" },
  { id: "boost-500", boosts: 500, usd: 500, label: "Golden Rocket", tagline: "Gold ticker + crown, full send", golden: true },
];

export function getPackage(id: string): BoostPackage | undefined {
  return BOOST_PACKAGES.find((p) => p.id === id);
}
