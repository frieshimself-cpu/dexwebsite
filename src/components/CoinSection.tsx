import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Rocket } from "lucide-react";
import type { SiteConfig } from "@shared/types";
import { api } from "../lib/api";

export default function CoinSection() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.config().then(setConfig).catch(() => {});
  }, []);

  const ca = config?.pumpFunCA ?? "";

  const copy = async () => {
    await navigator.clipboard.writeText(ca).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="coin" className="relative mx-auto max-w-5xl px-5 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-rocket-purple/40 bg-gradient-to-br from-rocket-purple/20 via-background to-rocket-pink/10 p-10 text-center md:p-14"
      >
        <img
          src="/logo.svg"
          alt=""
          className="mx-auto mb-6 h-24 w-24 animate-floaty drop-shadow-[0_0_30px_rgba(124,92,255,0.5)]"
        />
        <span className="pill mb-4">
          <Rocket className="h-3.5 w-3.5 text-rocket-pink" />
          Our own coin
        </span>
        <h2 className="font-display text-4xl font-medium md:text-5xl">
          $ROCKET is live on <span className="text-gradient">pump.fun</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          MemeRocket has its own token. Ape it, boost it, send it — we eat our own rocket fuel.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-border bg-background/60 p-2 pl-5">
          <code className="flex-1 truncate text-left font-mono text-xs text-muted-foreground md:text-sm">
            {ca || "…"}
          </code>
          <button
            onClick={copy}
            className="btn-primary h-9 w-9 shrink-0 !p-0"
            aria-label="Copy contract address"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {config && (
          <a
            href={config.pumpFunUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mt-5 inline-flex px-6 py-3 text-sm"
          >
            View on pump.fun <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </motion.div>
    </section>
  );
}
