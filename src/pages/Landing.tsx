import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";
import Hero from "../components/Hero";
import TickerMarquee from "../components/TickerMarquee";
import StatsStrip from "../components/StatsStrip";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Comparison from "../components/Comparison";
import Pricing from "../components/Pricing";
import CoinSection from "../components/CoinSection";
import CTASection from "../components/CTASection";
import Starfield from "../components/Starfield";
import TokenTable from "../components/TokenTable";
import type { TrendingToken } from "@shared/types";
import { api } from "../lib/api";

const FAQ = [
  {
    q: "What does a boost actually do?",
    a: "Each active boost multiplies your token's trending score on MemeRocket, pushing it up the board for 24 hours. Boosted tokens always show a ⚡ badge so everyone knows it's promoted.",
  },
  {
    q: "How do I pay?",
    a: "SOL only. Scan the Solana Pay QR with Phantom/Solflare or plain-send the exact amount shown to our wallet. The backend watches the chain and activates your boost automatically — usually under a minute.",
  },
  {
    q: "Why is it so much cheaper than the big screeners?",
    a: "Because $99 for ten boosts is robbery. We run lean and pass it on: $1 per boost, flat.",
  },
  {
    q: "Do boosts change my token's price or ranking on other sites?",
    a: "No. Boosts only affect visibility on MemeRocket's own trending board. Nothing on-chain, nothing anywhere else.",
  },
];

export default function Landing() {
  const [top, setTop] = useState<TrendingToken[]>([]);

  useEffect(() => {
    api
      .trending()
      .then((r) => setTop(r.tokens.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <main>
      <Hero />
      <TickerMarquee />
      <StatsStrip />

      {/* trending preview */}
      <section className="relative mx-auto max-w-7xl px-5 py-24">
        <Starfield />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative mb-10 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <span className="pill mb-4">
              <Flame className="h-3.5 w-3.5 text-primary" />
              Live right now
            </span>
            <h2 className="font-display text-4xl font-medium md:text-5xl">
              Today's <span className="text-gradient">trending board</span>
            </h2>
          </div>
          <Link to="/app" className="btn-secondary px-5 py-2.5 text-sm">
            Open full screener <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
        {top.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <TokenTable tokens={top} />
          </motion.div>
        )}
      </section>

      <Features />
      <HowItWorks />
      <Comparison />
      <Pricing />
      <CoinSection />

      {/* FAQ */}
      <section id="faq" className="relative mx-auto max-w-3xl px-5 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center font-display text-4xl font-medium"
        >
          Questions, <span className="text-gradient">answered</span>
        </motion.h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((f, i) => (
            <motion.details
              key={f.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="card-surface group p-5 open:border-primary/30"
            >
              <summary className="cursor-pointer list-none font-display font-semibold marker:hidden">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      <CTASection />
    </main>
  );
}
