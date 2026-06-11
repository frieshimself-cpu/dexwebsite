import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, RefreshCw, LogOut, ExternalLink, Zap, Megaphone, Loader2 } from "lucide-react";
import type { AdminOverview } from "@shared/types";
import { fmtUsd, shortAddr, solAmount, timeLeft } from "../lib/format";

const KEY_STORAGE = "memerocket_admin_key";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-surface p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-primary">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-primary/15 text-primary"
      : status === "pending"
        ? "bg-amber-400/15 text-amber-300"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${cls}`}>{status}</span>;
}

export default function Admin() {
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? "");
  const [input, setInput] = useState("");
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (k: string) => {
      if (!k) return;
      setLoading(true);
      setError("");
      try {
        const r = await fetch("/api/admin/overview", { headers: { "x-admin-key": k } });
        if (r.status === 401) {
          setError("Wrong key.");
          setData(null);
          localStorage.removeItem(KEY_STORAGE);
          setKey("");
          return;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setData((await r.json()) as AdminOverview);
        localStorage.setItem(KEY_STORAGE, k);
      } catch (e) {
        setError("Couldn't load — try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (key) load(key);
  }, [key, load]);

  useEffect(() => {
    if (!key) return;
    const t = setInterval(() => load(key), 30_000);
    return () => clearInterval(t);
  }, [key, load]);

  if (!key || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface w-full p-7 text-center"
        >
          <KeyRound className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h1 className="font-display text-xl font-semibold">Mission control</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your admin key to see sales.</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setKey(input.trim())}
            placeholder="ADMIN_KEY"
            className="mt-4 w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-center font-mono text-sm outline-none focus:border-primary/60"
          />
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
          <button
            onClick={() => setKey(input.trim())}
            disabled={!input.trim() || loading}
            className="btn-primary mt-4 w-full py-3 text-sm disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
          </button>
        </motion.div>
      </main>
    );
  }

  const { totals, orders, activeBoosts, activeAds } = data;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-20 pt-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Mission control</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(key)}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(KEY_STORAGE);
              setKey("");
              setData(null);
            }}
            className="btn-secondary px-4 py-2 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Lock
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Revenue"
          value={fmtUsd(totals.totalUsd)}
          sub={`${solAmount(totals.totalSol)} SOL received`}
        />
        <StatCard label="Paid orders" value={String(totals.paidCount)} sub={`${totals.pendingCount} pending`} />
        <StatCard label="Active boosts" value={String(activeBoosts.length)} />
        <StatCard label="Active ads" value={String(activeAds.length)} />
      </div>

      {activeBoosts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Zap className="h-4 w-4 text-primary" /> Active boosts
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeBoosts.map((b) => (
              <span
                key={b.id}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  b.golden ? "border-gold/40 text-gold" : "border-primary/30 text-primary"
                }`}
              >
                {b.tokenSymbol ?? shortAddr(b.tokenAddress)} · {b.boosts}x · {timeLeft(b.expiresAt)} left
              </span>
            ))}
          </div>
        </section>
      )}

      {activeAds.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Megaphone className="h-4 w-4 text-rocket-pink" /> Active ads
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeAds.map((a) => (
              <a
                key={a.id}
                href={a.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                {a.name} · {timeLeft(a.expiresAt)} left ↗
              </a>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-3 font-display text-lg font-semibold">Orders</h2>
      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="px-4 py-3 text-right font-medium">USD</th>
              <th className="px-4 py-3 text-right font-medium">SOL</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No orders yet — share the site and watch this fill up.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border/60">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs">{o.type === "boost" ? "⚡ Boost" : "📣 Ad"}</td>
                <td className="px-4 py-3 font-mono text-xs">{o.tokenSymbol ?? shortAddr(o.tokenAddress)}</td>
                <td className="px-4 py-3 text-xs">
                  {o.type === "boost" ? `${o.boosts}x` : `${o.adDays} day${(o.adDays ?? 0) > 1 ? "s" : ""}`}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{fmtUsd(o.usd)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{solAmount(o.payment.amountSol)}</td>
                <td className="px-4 py-3">
                  <StatusPill status={o.status} />
                </td>
                <td className="px-4 py-3">
                  {o.signature ? (
                    <a
                      href={`https://solscan.io/tx/${o.signature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {shortAddr(o.signature, 5)} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
