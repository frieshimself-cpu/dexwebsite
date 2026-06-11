import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useBoostModal } from "../context/BoostModalContext";
import Starfield from "./Starfield";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260221_085953_8463b46e-ba85-4bb7-912a-1feaf346e970.mp4";

// Seamless loop: fade to black starting 1.5s before the end (fully black by
// 0.3s before the end), fade back in over the first 1s after restart.
const FADE_OUT_START = 1.5;
const FADE_OUT_END = 0.3;
const FADE_IN_DURATION = 1.0;

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
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
      {videoFailed ? (
        // graceful fallback if the CDN video can't load
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_8%,rgba(124,92,255,0.28),transparent),radial-gradient(45%_40%_at_82%_72%,rgba(200,241,53,0.12),transparent),radial-gradient(50%_45%_at_12%_78%,rgba(255,92,210,0.16),transparent)]" />
          <Starfield />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

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

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <ChevronDown className="h-5 w-5 text-muted-foreground/70" />
        </motion.div>
      </motion.div>
    </section>
  );
}
