export function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (n < 0.000001) return "$" + n.toExponential(2);
  if (n < 0.01) return "$" + n.toFixed(6).replace(/0+$/, "");
  if (n < 1) return "$" + n.toFixed(4);
  if (n < 1000) return "$" + n.toFixed(2);
  return "$" + compact(n);
}

export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return (n > 0 ? "+" : "") + n.toFixed(Math.abs(n) >= 100 ? 0 : 1) + "%";
}

// Full 9-decimal precision: order amounts carry a tiny unique "dust" suffix
// used to match payments on-chain, so it must never be rounded away.
export function solAmount(n: number): string {
  return n.toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
}

export function fmtSol(n: number): string {
  return solAmount(n) + " SOL";
}

export function shortAddr(a: string, n = 4): string {
  if (a.length <= n * 2 + 1) return a;
  return a.slice(0, n) + "…" + a.slice(-n);
}

export function timeLeft(ts: number): string {
  const ms = ts - Date.now();
  if (ms <= 0) return "expired";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
