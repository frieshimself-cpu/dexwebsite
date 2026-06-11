import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Zap } from "lucide-react";
import type { SiteConfig, TokenLookup } from "@shared/types";
import { api } from "../lib/api";
import { fmtPct, fmtUsd, shortAddr } from "../lib/format";
import { useBoostModal } from "../context/BoostModalContext";

/** Slim spotlight card for the official $ROCKET coin, shown on the screener. */
export default function OfficialCoin() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [token, setToken] = useState<TokenLookup | null>(null);
  const [copied, setCopied] = useState(false);
  const { openBoost } = useBoostModal();

  useEffect(() => {
    api
      .config()
      .then((c) => {
        setConfig(c);
        return api.token(c.pumpFunCA);
      })
      .then((t) => t && setToken(t))
      .catch(() => {});
  }, []);

  if (!config) return null;
  const ca = config.pumpFunCA;

  const copy = async () => {
    await navigator.clipboard.writeText(ca).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-rocket-purple/35 bg-gradient-to-r from-rocket-purple/15 via-transparent to-primary/10 px-4 py-3"
    >
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="" className="h-9 w-9 rounded-full ring-1 ring-rocket-purple/50" />
        <div>
          <div className="flex items-center gap-1.5 text-sm font-bold">
            $ROCKET
            <span className="rounded-full bg-rocket-purple/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rocket-purple">
              Official
            </span>
          </div>
          <div className="text-xs text-muted-foreground">MemeRocket's own coin</div>
        </div>
      </div>

      {token?.found && (
        <div className="flex items-center gap-3 text-xs font-mono">
          <span>{fmtUsd(token.priceUsd)}</span>
          <span className={(token.change24h ?? 0) >= 0 ? "text-primary" : "text-rose-400"}>
            {fmtPct(token.change24h)}
          </span>
          <span className="hidden text-muted-foreground sm:inline">MC {fmtUsd(token.marketCapUsd)}</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          {shortAddr(ca, 4)}
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
        </button>
        <a
          href={config.pumpFunUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          pump.fun <ExternalLink className="h-3 w-3" />
        </a>
        <button onClick={() => openBoost({ token: ca })} className="btn-primary px-3 py-1.5 text-xs">
          <Zap className="h-3 w-3" /> Boost
        </button>
      </div>
    </motion.div>
  );
}
