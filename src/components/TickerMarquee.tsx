import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap } from "lucide-react";
import type { TrendingToken } from "@shared/types";
import { api } from "../lib/api";
import { fmtPct, fmtUsd } from "../lib/format";

/** Infinite scrolling strip of live top movers. */
export default function TickerMarquee() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .trending()
        .then((r) => alive && setTokens(r.tokens.slice(0, 14)))
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (tokens.length === 0) return null;
  const doubled = [...tokens, ...tokens];

  return (
    <div className="relative overflow-hidden border-y border-border bg-muted/30 py-3">
      <div className="flex w-max animate-marquee gap-8 px-4 hover:[animation-play-state:paused]">
        {doubled.map((t, i) => (
          <Link
            key={t.address + i}
            to={`/token/${t.address}`}
            className="flex shrink-0 items-center gap-2 text-sm"
          >
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">{t.symbol}</span>
            <span className="text-muted-foreground">{fmtUsd(t.priceUsd)}</span>
            <span className={t.change24h >= 0 ? "text-primary" : "text-rose-400"}>
              {fmtPct(t.change24h)}
            </span>
            {t.activeBoosts > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                <Zap className="h-3 w-3" />
                {t.activeBoosts}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
