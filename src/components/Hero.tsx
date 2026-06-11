import { useEffect, useRef } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useBoostModal } from "../context/BoostModalContext";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260221_085953_8463b46e-ba85-4bb7-912a-1feaf346e970.mp4";

// Seamless loop: fade to black starting 1.5s before the end (fully black by
// 0.3s before the end), fade back in over the first 1s after restart.
const FADE_OUT_START = 1.5;
const FADE_OUT_END = 0.3;
const FADE_IN_DURATION = 1.0;

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { openBoost } = useBoostModal();

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v && v.duration && !Number.isNaN(v.duration)) {
        const remaining = v.duration - v.currentTime;
        let opacity = 1;
        if (remaining <= FADE_OUT_START) {
          opacity = Math.max(0, (remaining - FADE_OUT_END) / (FADE_OUT_START - FADE_OUT_END));
        }
        if (v.currentTime < FADE_IN_DURATION) {
          opacity = Math.min(opacity, v.currentTime / FADE_IN_DURATION);
        }
        v.style.opacity = opacity.toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.15 + i * 0.12, duration: 0.6, ease: "easeOut" as const },
    }),
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* bottom-aligned content */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-[100px]">
        <div className="mx-auto flex w-full max-w-[603px] flex-col items-center px-5 text-center">
          <motion.div custom={0} initial="hidden" animate="show" variants={item} className="pill mb-5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Introducing MemeRocket Boosts
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={item}
            className="font-display text-[36px] font-medium leading-[1.1] md:text-[48px] lg:text-[62px]"
          >
            Strap a rocket to your token
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={item}
            className="mt-5 max-w-[520px] text-muted-foreground"
          >
            Live charts, real-time trending, and boosts that start at $10 — a fraction of what the
            big screeners charge. Get seen by degens in minutes, not days.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button onClick={() => openBoost()} className="btn-primary px-7 py-3.5 text-[18px]">
              <ArrowUpRight className="h-5 w-5" />
              Boost Your Token
            </button>
            <button
              onClick={() => document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-secondary px-7 py-3.5 text-[18px]"
            >
              See Pricing
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
