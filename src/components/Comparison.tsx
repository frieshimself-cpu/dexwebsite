import { motion } from "framer-motion";
import { Check, X, Rocket } from "lucide-react";

const ROWS: Array<{ feature: string; us: string; them: string; usGood?: boolean; themBad?: boolean }> = [
  { feature: "10x boost", us: "$10", them: "$99+" },
  { feature: "100x boost", us: "$100", them: "$499+" },
  { feature: "Golden ticker", us: "Included at 500x", them: "Premium upsell" },
  { feature: "Banner ads", us: "$25 / day", them: "$$$$" },
  { feature: "Checkout", us: "Scan QR, pay in SOL", them: "Forms & invoices" },
  { feature: "Activation", us: "Automatic, on-chain", them: "Wait around" },
];

export default function Comparison() {
  return (
    <section className="relative mx-auto max-w-5xl px-5 py-24">
      {/* decorative glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-rocket-purple/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-12 max-w-xl text-center"
      >
        <span className="pill mb-4">The receipts</span>
        <h2 className="font-display text-4xl font-medium md:text-5xl">
          Same rocket science.
          <br />
          <span className="text-gradient">90% less fuel cost.</span>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card-surface overflow-hidden"
      >
        <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border bg-muted/40 text-sm font-semibold">
          <div className="px-5 py-4 text-muted-foreground">What you get</div>
          <div className="flex items-center gap-1.5 px-5 py-4 text-primary">
            <Rocket className="h-4 w-4" /> MemeRocket
          </div>
          <div className="px-5 py-4 text-muted-foreground">The big screeners</div>
        </div>
        {ROWS.map((r, i) => (
          <motion.div
            key={r.feature}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border/60 text-sm last:border-0"
          >
            <div className="px-5 py-4 font-medium">{r.feature}</div>
            <div className="flex items-center gap-2 px-5 py-4 font-semibold text-primary">
              <Check className="h-4 w-4 shrink-0" />
              {r.us}
            </div>
            <div className="flex items-center gap-2 px-5 py-4 text-muted-foreground">
              <X className="h-4 w-4 shrink-0 text-rose-400/70" />
              {r.them}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Competitor pricing based on publicly listed promotion rates at the time of writing.
      </p>
    </section>
  );
}
