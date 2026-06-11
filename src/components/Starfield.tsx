import { useEffect, useRef } from "react";

/** Subtle parallax starfield canvas used behind landing sections. */
export default function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let w = 0;
    let h = 0;

    interface Star {
      x: number;
      y: number;
      r: number;
      speed: number;
      tw: number;
      hue: number;
    }
    let stars: Star[] = [];

    const resize = () => {
      const parent = canvas.parentElement!;
      w = canvas.width = parent.clientWidth;
      h = canvas.height = parent.clientHeight;
      const count = Math.min(220, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        speed: Math.random() * 0.16 + 0.03,
        tw: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.12 ? 73 : Math.random() < 0.5 ? 255 : 0,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y -= s.speed;
        if (s.y < -2) {
          s.y = h + 2;
          s.x = Math.random() * w;
        }
        const alpha = 0.35 + Math.sin(t / 900 + s.tw) * 0.25;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle =
          s.hue === 73
            ? `hsla(73, 98%, 57%, ${alpha})`
            : s.hue === 255
              ? `hsla(255, 80%, 75%, ${alpha * 0.9})`
              : `hsla(0, 0%, 100%, ${alpha * 0.8})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden />;
}
