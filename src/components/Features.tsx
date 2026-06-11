import { motion } from "framer-motion";
import {
  Zap,
  LineChart,
  Megaphone,
  Crown,
  Timer,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Boosts from $10",
    desc: "The big screeners charge $99 for a 10x boost. Ours start at ten bucks. Same rocket, fraction of the fuel bill.",
    accent: "text-primary",
  },
  {
    icon: LineChart,
    title: "Live trending board",
    desc: "Real market data — price, volume, txns, liquidity — refreshed continuously. Boosts multiply your score and shoot you up the ranks.",
    accent: "text-rocket-blue",
  },
  {
    icon: Megaphone,
    title: "Banner ads",
    desc: "Run a banner across the screener for $25/day. Your art, your link, in front of every degen scrolling the board.",
    accent: "text-rocket-pink",
  },
  {
    icon: Crown,
    title: "Golden Rocket",
    desc: "The 500x package crowns your token gold — shimmering row, crown badge, maximum aura. Impossible to scroll past.",
    accent: "text-gold",
  },
  {
    icon: Timer,
    title: "24h boost duration",
    desc: "Every boost burns for a full 24 hours. Stack multiple packages to climb higher and stay longer.",
    accent: "text-rocket-purple",
  },
  {
    icon: Wallet,
    title: "Pay in seconds",
    desc: "Solana Pay QR or a plain wallet transfer — on-chain verification activates your boost automatically. No sign-ups, no emails.",
    accent: "text-primary",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-14 max-w-xl text-center"
      >
        <span className="pill mb-4">Why MemeRocket</span>
        <h2 className="font-display text-4xl font-medium md:text-5xl">
          Built for <span className="text-gradient">maximum visibility</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Everything the big screeners do — cheaper, faster, and with way more personality.
        </p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
            whileHover={{ y: -6 }}
            className="card-surface group relative overflow-hidden p-6"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/0 blur-3xl transition-all duration-500 group-hover:bg-primary/15" />
            <f.icon className={`mb-4 h-8 w-8 ${f.accent}`} />
            <h3 className="font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
