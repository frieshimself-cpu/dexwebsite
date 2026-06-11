import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { api } from "../lib/api";

function useCountUp(target: number, start: boolean, duration = 1400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
}

interface Cell {
  value: string | number;
  suffix?: string;
  label: string;
  countTo?: number;
}

function StatCell({ cell, start }: { cell: Cell; start: boolean }) {
  const counted = useCountUp(cell.countTo ?? 0, start && cell.countTo != null);
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-7 text-center">
      <span className="font-display text-3xl font-bold text-primary md:text-4xl">
        {cell.countTo != null ? counted : cell.value}
        {cell.suffix}
      </span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{cell.label}</span>
    </div>
  );
}

export default function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [tokensTracked, setTokensTracked] = useState(0);
  const [boostsSold, setBoostsSold] = useState(0);

  useEffect(() => {
    api.trending().then((r) => setTokensTracked(r.tokens.length)).catch(() => {});
    api.stats().then((s) => setBoostsSold(s.boostsSold)).catch(() => {});
  }, []);

  const cells: Cell[] = [
    { value: tokensTracked, countTo: tokensTracked, label: "tokens tracked live" },
    { value: "90", suffix: "%", countTo: 90, label: "cheaper than the big guys" },
    { value: "24", suffix: "h", countTo: 24, label: "burn per boost" },
    boostsSold > 0
      ? { value: boostsSold, countTo: boostsSold, suffix: "⚡", label: "boosts sold" }
      : { value: "$10", label: "entry price" },
  ];

  return (
    <div ref={ref} className="border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
        {cells.map((c) => (
          <StatCell key={c.label} cell={c} start={inView} />
        ))}
      </div>
    </div>
  );
}
