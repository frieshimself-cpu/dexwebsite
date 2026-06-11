import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Flame, RefreshCw, WifiOff } from "lucide-react";
import type { TrendingResponse, TrendingToken } from "@shared/types";
import { api } from "../lib/api";
import TokenTable, { type SortKey, type SortState } from "../components/TokenTable";
import AdBanner from "../components/AdBanner";
import OfficialCoin from "../components/OfficialCoin";
import { useBoostModal } from "../context/BoostModalContext";

type Tab = "trending" | "boosted";

export default function Screener() {
  const [data, setData] = useState<TrendingResponse | null>(null);
  const [tab, setTab] = useState<Tab>("trending");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: "score", dir: -1 });
  const [flash, setFlash] = useState<Map<string, "up" | "down">>(new Map());
  const [, setTick] = useState(0);
  const prevPrices = useRef<Map<string, number>>(new Map());
  const { openBoost } = useBoostModal();

  const load = async () => {
    setRefreshing(true);
    try {
      const fresh = await api.trending();
      // flash price cells that moved since the last refresh
      const flashes = new Map<string, "up" | "down">();
      for (const t of fresh.tokens) {
        const prev = prevPrices.current.get(t.address);
        if (prev != null && prev !== t.priceUsd) flashes.set(t.address, t.priceUsd > prev ? "up" : "down");
      }
      prevPrices.current = new Map(fresh.tokens.map((t) => [t.address, t.priceUsd]));
      setFlash(flashes);
      setData(fresh);
    } catch {
      // keep last data
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  // re-render every second so "updated Xs ago" ticks
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === -1 ? 1 : -1 } : { key, dir: -1 }));

  const tokens = useMemo(() => {
    let list = data?.tokens ?? [];
    if (tab === "boosted") list = list.filter((t) => t.activeBoosts > 0);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.address.toLowerCase() === q
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = a[sort.key] as number;
      const bv = b[sort.key] as number;
      return sort.dir === -1 ? bv - av : av - bv;
    });
    return sorted;
  }, [data, tab, query, sort]);

  const updatedAgo = data ? Math.max(0, Math.round((Date.now() - data.updatedAt) / 1000)) : null;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-20 pt-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-semibold">
            Trending board
            {data && (
              <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-normal text-muted-foreground">
                {data.live ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    LIVE{updatedAgo != null && ` · ${updatedAgo}s ago`}
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-amber-400" /> demo data
                  </>
                )}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real market data, refreshed every 30s. ⚡ = paid boosts (disclosed, always).
          </p>
        </div>
        <button onClick={() => openBoost()} className="btn-primary px-5 py-2.5 text-sm">
          <Zap className="h-4 w-4" />
          Boost a token
        </button>
      </div>

      <OfficialCoin />
      <AdBanner />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-muted/30 p-1">
          {(
            [
              { id: "trending", label: "Trending", icon: Flame },
              { id: "boosted", label: "Boosted", icon: Zap },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition ${
                tab === t.id ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, name or CA"
            className="w-64 max-w-[70vw] rounded-full border border-border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary/50"
          />
        </div>
        <button
          onClick={load}
          className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!data ? (
        <div className="card-surface flex h-72 items-center justify-center">
          <motion.img
            src="/logo.png"
            alt=""
            className="h-16 w-16 rounded-full"
            animate={{ y: [0, -12, 0], rotate: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
        </div>
      ) : tokens.length === 0 ? (
        <div className="card-surface flex h-72 flex-col items-center justify-center gap-3 text-center">
          <Zap className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {tab === "boosted" ? "No active boosts right now — be the first on the board." : "Nothing matches that search."}
          </p>
          {tab === "boosted" && (
            <button onClick={() => openBoost()} className="btn-primary px-5 py-2.5 text-sm">
              <Zap className="h-4 w-4" /> Boost a token
            </button>
          )}
        </div>
      ) : (
        <TokenTable tokens={tokens} sort={sort} onSort={onSort} flash={flash} />
      )}
    </main>
  );
}
