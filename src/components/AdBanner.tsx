import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import type { ActiveAd } from "@shared/types";
import { api } from "../lib/api";
import { useBoostModal } from "../context/BoostModalContext";

/** Rotates paid banner ads above the screener; self-promo slot when empty. */
export default function AdBanner() {
  const [ads, setAds] = useState<ActiveAd[]>([]);
  const [idx, setIdx] = useState(0);
  const { openAd } = useBoostModal();

  useEffect(() => {
    let alive = true;
    const load = () => api.ads().then((r) => alive && setAds(r.ads)).catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 8000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (ads.length === 0) {
    return (
      <button
        onClick={openAd}
        className="group relative mb-5 flex h-20 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/20 transition hover:border-primary/50"
      >
        <Megaphone className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
        <span className="text-sm text-muted-foreground transition group-hover:text-foreground">
          Your banner here — <span className="text-primary">$25/day</span>, live in minutes
        </span>
      </button>
    );
  }

  const ad = ads[Math.min(idx, ads.length - 1)];

  return (
    <div className="relative mb-5 h-24 w-full overflow-hidden rounded-2xl border border-border">
      <AnimatePresence mode="wait">
        <motion.a
          key={ad.id}
          href={ad.linkUrl}
          target="_blank"
          rel="noreferrer nofollow sponsored"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 block"
          title={ad.name}
        >
          <img src={ad.imageUrl} alt={ad.name} className="h-full w-full object-cover" />
        </motion.a>
      </AnimatePresence>
      <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/80">
        Ad
      </span>
    </div>
  );
}
