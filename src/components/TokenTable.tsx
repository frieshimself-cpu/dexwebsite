import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Crown } from "lucide-react";
import type { TrendingToken } from "@shared/types";
import { compact, fmtPct, fmtUsd } from "../lib/format";
import { useBoostModal } from "../context/BoostModalContext";

function Pct({ v }: { v: number }) {
  const cls = v > 0 ? "text-primary" : v < 0 ? "text-rose-400" : "text-muted-foreground";
  return <span className={cls}>{fmtPct(v)}</span>;
}

function TokenIcon({ t }: { t: TrendingToken }) {
  if (t.imageUrl) {
    return <img src={t.imageUrl} alt="" className="h-8 w-8 rounded-full ring-1 ring-border" loading="lazy" />;
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rocket-purple/60 to-rocket-blue/60 text-xs font-bold">
      {t.symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function TokenTable({ tokens }: { tokens: TrendingToken[] }) {
  const navigate = useNavigate();
  const { openBoost } = useBoostModal();

  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Token</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">5m</th>
            <th className="px-4 py-3 text-right font-medium">1h</th>
            <th className="px-4 py-3 text-right font-medium">6h</th>
            <th className="px-4 py-3 text-right font-medium">24h</th>
            <th className="px-4 py-3 text-right font-medium">Txns</th>
            <th className="px-4 py-3 text-right font-medium">Volume</th>
            <th className="px-4 py-3 text-right font-medium">Liquidity</th>
            <th className="px-4 py-3 text-right font-medium">MCap</th>
            <th className="px-4 py-3 text-right font-medium">Boosts</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <motion.tr
              key={t.address}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              onClick={() => navigate(`/token/${t.address}`)}
              className={`group cursor-pointer border-b border-border/60 transition hover:bg-primary/5 ${
                t.golden ? "golden-row" : t.activeBoosts > 0 ? "bg-primary/[0.04]" : ""
              }`}
            >
              <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                {t.rank <= 3 ? ["🥇", "🥈", "🥉"][t.rank - 1] : `#${t.rank}`}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <TokenIcon t={t} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${t.golden ? "shimmer-text" : ""}`}>{t.symbol}</span>
                      {t.golden && <Crown className="h-3.5 w-3.5 text-gold" />}
                    </div>
                    <div className="max-w-36 truncate text-xs text-muted-foreground">{t.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5 text-right font-mono">{fmtUsd(t.priceUsd)}</td>
              <td className="px-4 py-3.5 text-right font-mono text-xs"><Pct v={t.change5m} /></td>
              <td className="px-4 py-3.5 text-right font-mono text-xs"><Pct v={t.change1h} /></td>
              <td className="px-4 py-3.5 text-right font-mono text-xs"><Pct v={t.change6h} /></td>
              <td className="px-4 py-3.5 text-right font-mono text-xs"><Pct v={t.change24h} /></td>
              <td className="px-4 py-3.5 text-right font-mono text-xs">{compact(t.txns24h)}</td>
              <td className="px-4 py-3.5 text-right font-mono text-xs">${compact(t.volume24h)}</td>
              <td className="px-4 py-3.5 text-right font-mono text-xs">${compact(t.liquidityUsd)}</td>
              <td className="px-4 py-3.5 text-right font-mono text-xs">${compact(t.marketCapUsd)}</td>
              <td className="px-4 py-3.5 text-right">
                {t.activeBoosts > 0 ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      t.golden ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary"
                    }`}
                    title="Paid boosts active on this token"
                  >
                    <Zap className="h-3 w-3" />
                    {t.activeBoosts}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openBoost({ token: t.address });
                  }}
                  className="btn-primary px-3 py-1.5 text-xs transition md:opacity-0 md:group-hover:opacity-100"
                >
                  <Zap className="h-3 w-3" />
                  Boost
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
