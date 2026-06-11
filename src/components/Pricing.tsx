import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Crown, Megaphone, Check } from "lucide-react";
import type { SiteConfig } from "@shared/types";
import { api } from "../lib/api";
import { useBoostModal } from "../context/BoostModalContext";

export default function Pricing() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const { openBoost, openAd } = useBoostModal();

  useEffect(() => {
    api.config().then(setConfig).catch(() => {});
  }, []);

  const packages = config?.packages ?? [];

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-4 max-w-2xl text-center"
      >
        <span className="pill mb-4">Pricing</span>
        <h2 className="font-display text-4xl font-medium md:text-5xl">
          A dollar a boost. <span className="text-gradient">That's it.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Elsewhere a 10x boost runs you <s className="opacity-70">$99</s>. Here it's $10 — and every
          boost burns for a full {config?.boostDurationHours ?? 24} hours.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {packages.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`relative flex flex-col rounded-2xl border p-6 ${
              p.golden
                ? "border-gold/40 bg-gradient-to-b from-gold/15 to-transparent"
                : p.popular
                  ? "border-primary/50 bg-primary/5 animate-pulse-glow"
                  : "card-surface"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                MOST POPULAR
              </span>
            )}
            {p.golden ? (
              <Crown className="mb-3 h-7 w-7 text-gold" />
            ) : (
              <Zap className="mb-3 h-7 w-7 text-primary" />
            )}
            <div className={`font-display text-2xl font-bold ${p.golden ? "shimmer-text" : ""}`}>
              {p.boosts}x
            </div>
            <div className="text-sm font-semibold text-muted-foreground">{p.label}</div>
            <p className="mt-2 min-h-10 text-xs text-muted-foreground">{p.tagline}</p>
            <div className="mt-4 font-display text-3xl font-bold">
              ${p.usd}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/ 24h</span>
            </div>
            <button
              onClick={() => openBoost({ packageId: p.id })}
              className={`mt-5 w-full rounded-full py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                p.golden
                  ? "gold-gradient text-primary-foreground hover:brightness-110"
                  : "btn-primary"
              }`}
            >
              Boost {p.boosts}x
            </button>
          </motion.div>
        ))}
      </div>

      {/* ad banner offer */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="card-surface mt-8 flex flex-col items-center justify-between gap-5 p-7 md:flex-row"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rocket-pink/15 ring-1 ring-rocket-pink/40">
            <Megaphone className="h-6 w-6 text-rocket-pink" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">Banner ads on the screener</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your banner, rotating above the trending board. ${config?.adPricePerDay ?? 25}/day, up
              to 30 days.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ul className="hidden text-xs text-muted-foreground lg:block">
            {["Live within minutes of payment", "Any image + link", "Pay with SOL"].map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary" /> {x}
              </li>
            ))}
          </ul>
          <button onClick={openAd} className="btn-secondary shrink-0 px-6 py-3 text-sm">
            Book an Ad
          </button>
        </div>
      </motion.div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Boosts multiply a token's trending score on MemeRocket and are always disclosed with a ⚡
        badge. They don't change the token itself, its price, or rankings anywhere else.
      </p>
    </section>
  );
}
