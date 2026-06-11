import { motion } from "framer-motion";
import { ArrowUpRight, LineChart } from "lucide-react";
import { Link } from "react-router-dom";
import { useBoostModal } from "../context/BoostModalContext";

export default function CTASection() {
  const { openBoost } = useBoostModal();

  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-background to-rocket-purple/15 px-8 py-16 text-center md:py-20"
      >
        {/* floating decorative rockets */}
        <img
          src="/logo.svg"
          alt=""
          className="pointer-events-none absolute -left-4 top-8 h-20 w-20 animate-floaty opacity-50"
          aria-hidden
        />
        <img
          src="/logo.svg"
          alt=""
          className="pointer-events-none absolute -right-2 bottom-6 h-28 w-28 animate-floaty opacity-40 [animation-delay:1.2s]"
          aria-hidden
        />
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

        <h2 className="font-display text-4xl font-medium md:text-6xl">
          Ready for <span className="text-gradient">lift-off?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Ten bucks and thirty seconds from now, your token is climbing the board.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => openBoost()} className="btn-primary px-8 py-4 text-[18px]">
            <ArrowUpRight className="h-5 w-5" />
            Boost Your Token
          </button>
          <Link to="/app" className="btn-secondary px-8 py-4 text-[18px]">
            <LineChart className="h-5 w-5" />
            Open Screener
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
