import { motion } from "framer-motion";
import { ClipboardPaste, QrCode, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardPaste,
    step: "01",
    title: "Paste your CA",
    desc: "Drop your token's contract address and pick a boost package. We pull the token's live stats automatically.",
  },
  {
    icon: QrCode,
    step: "02",
    title: "Scan & pay with SOL",
    desc: "Scan the Solana Pay QR with any wallet (Phantom, Solflare…) or plain-send the exact amount. We verify it on-chain.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Watch it climb",
    desc: "The boost activates automatically within seconds of confirmation and your token rockets up the trending board for 24h.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-14 max-w-xl text-center"
      >
        <span className="pill mb-4">How it works</span>
        <h2 className="font-display text-4xl font-medium md:text-5xl">
          Three steps to <span className="text-gradient">lift-off</span>
        </h2>
      </motion.div>

      <div className="relative grid gap-6 md:grid-cols-3">
        {/* dotted flight path connecting the steps */}
        <svg
          className="pointer-events-none absolute left-0 right-0 top-12 hidden h-8 w-full md:block"
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 80 20 C 300 -10, 420 50, 500 20 S 750 -10, 920 20"
            fill="none"
            stroke="hsl(73 98% 57% / 0.35)"
            strokeWidth="2"
            strokeDasharray="6 8"
          />
        </svg>

        {STEPS.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="card-surface relative p-7 text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
              <s.icon className="h-7 w-7 text-primary" />
            </div>
            <div className="font-mono text-xs tracking-[0.3em] text-primary">{s.step}</div>
            <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
