import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Crown, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { TrendingToken } from "@shared/types";
import { compact, fmtPct, fmtUsd } from "../lib/format";
import { useBoostModal } from "../context/BoostModalContext";

export type SortKey =
  | "score"
  | "priceUsd"
  | "change5m"
  | "change1h"
  | "change6h"
  | "change24h"
  | "txns24h"
  | "volume24h"
  | "liquidityUsd"
  | "marketCapUsd"
  | "activeBoosts";

export interface SortState {
  key: SortKey;
  dir: 1 | -1;
}

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

interface Props {
  tokens: TrendingToken[];
  sort?: SortState;
  onSort?: (key: SortKey) => void;
  flash?: Map<string, "up" | "down">;
}

export default function TokenTable({ tokens, sort, onSort, flash }: Props) {
  const navigate = useNavigate();
  const { openBoost } = useBoostModal();

  const Th = ({ label, k, right = true }: { label: string; k?: SortKey; right?: boolean }) => {
    const sortable = !!onSort && !!k;
    const active = sortable && sort?.key === k;
    return (
      <th className={`px-4 py-3 font-medium ${right ? "text-right" : "text-left"}`}>
        {sortable ? (
          <button
            onClick={() => onSort!(k!)}
            className={`group/th inline-flex items-center gap-1 transition hover:text-foreground ${
              active ? "text-primary" : ""
            }`}
          >
            {label}
            {active ? (
              sort!.dir === -1 ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUp className="h-3 w-3" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-0 transition group-hover/th:opacity-60" />
            )}
          </button>
        ) : (
          label
        )}
      </th>
    );
  };

  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <Th label="#" k="score" right={false} />
            <Th label="Token" right={false} />
            <Th label="Price" k="priceUsd" />
            <Th label="5m" k="change5m" />
            <Th label="1h" k="change1h" />
            <Th label="6h" k="change6h" />
            <Th label="24h" k="change24h" />
            <Th label="Txns" k="txns24h" />
            <Th label="Volume" k="volume24h" />
            <Th label="Liquidity" k="liquidityUsd" />
            <Th label="MCap" k="marketCapUsd" />
            <Th label="Boosts" k="activeBoosts" />
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => {
            const flashDir = flash?.get(t.address);
            return (
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
                <td
                  key={`${t.address}:${t.priceUsd}`}
                  className={`px-4 py-3.5 text-right font-mono ${
                    flashDir === "up" ? "flash-up" : flashDir === "down" ? "flash-down" : ""
                  }`}
                >
                  {fmtUsd(t.priceUsd)}
                </td>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
