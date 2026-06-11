import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Copy, Check, ExternalLink, AlertTriangle } from "lucide-react";
import type { TokenLookup } from "@shared/types";
import { api } from "../lib/api";
import { fmtPct, fmtUsd, shortAddr } from "../lib/format";
import { useBoostModal } from "../context/BoostModalContext";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-semibold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

export default function TokenDetail() {
  const { address = "" } = useParams();
  const [token, setToken] = useState<TokenLookup | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openBoost } = useBoostModal();

  useEffect(() => {
    setToken(null);
    setFailed(false);
    api
      .token(address)
      .then(setToken)
      .catch(() => setFailed(true));
    const t = setInterval(() => api.token(address).then(setToken).catch(() => {}), 30_000);
    return () => clearInterval(t);
  }, [address]);

  const copy = async () => {
    await navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-20 pt-24">
      <Link
        to="/app"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to screener
      </Link>

      {failed && (
        <div className="card-surface flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <AlertTriangle className="h-5 w-5 text-amber-400" /> Couldn't load this token. Check the
          address and try again.
        </div>
      )}

      {token && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {token.imageUrl ? (
                <img src={token.imageUrl} alt="" className="h-14 w-14 rounded-full ring-2 ring-border" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rocket-purple/60 to-rocket-blue/60 text-lg font-bold">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
              <div>
                <h1 className="flex flex-wrap items-center gap-2.5 font-display text-2xl font-semibold">
                  {token.name}
                  <span className="text-base text-muted-foreground">{token.symbol}</span>
                  {token.activeBoosts > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-sm font-bold text-primary">
                      <Zap className="h-4 w-4" />
                      {token.activeBoosts} active
                    </span>
                  )}
                </h1>
                <button
                  onClick={copy}
                  className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition hover:text-foreground"
                >
                  {shortAddr(address, 8)}
                  {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`https://solscan.io/token/${address}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-4 py-2.5 text-sm"
              >
                Solscan <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button onClick={() => openBoost({ token: address })} className="btn-primary px-5 py-2.5 text-sm">
                <Zap className="h-4 w-4" /> Boost this token
              </button>
            </div>
          </div>

          {/* stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Price" value={fmtUsd(token.priceUsd)} />
            <Stat
              label="24h change"
              value={fmtPct(token.change24h)}
              accent={(token.change24h ?? 0) >= 0 ? "text-primary" : "text-rose-400"}
            />
            <Stat label="Market cap" value={fmtUsd(token.marketCapUsd)} />
            <Stat label="Liquidity" value={fmtUsd(token.liquidityUsd)} />
          </div>

          {/* chart */}
          {token.pairAddress ? (
            <div className="card-surface overflow-hidden">
              <iframe
                title="chart"
                src={`https://dexscreener.com/${token.chain}/${token.pairAddress}?embed=1&theme=dark&info=0`}
                className="h-[560px] w-full border-0"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="card-surface flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              No live chart found for this token yet.
            </div>
          )}
        </motion.div>
      )}
    </main>
  );
}
