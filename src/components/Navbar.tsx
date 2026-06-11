import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Rocket } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useBoostModal } from "../context/BoostModalContext";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Screener", to: "/app" },
  { label: "Boosts", to: "/#pricing" },
  { label: "$ROCKET", to: "/#coin" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { openBoost } = useBoostModal();
  const onLanding = pathname === "/";

  const go = (to: string) => {
    setOpen(false);
    if (to.startsWith("/#")) {
      if (pathname !== "/") navigate("/" + to.slice(1));
      else document.querySelector(to.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(to);
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 ${
        onLanding ? "" : "border-b border-border bg-background/75 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        {/* brand */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-full" />
          <span className="font-display text-lg font-semibold tracking-tight">
            MemeRocket<span className="text-primary">.</span>
          </span>
        </Link>

        {/* center links (desktop) */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => go(l.to)}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* CTA (desktop) */}
        <div className="hidden md:block">
          <button onClick={() => openBoost()} className="btn-primary px-5 py-2 text-sm">
            <Rocket className="h-4 w-4" />
            Boost a Token
          </button>
        </div>

        {/* hamburger (mobile) */}
        <button
          className="text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border-b border-border bg-background/95 px-5 pb-5 pt-2 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-4">
              {LINKS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => go(l.to)}
                  className="text-left text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  openBoost();
                }}
                className="btn-primary px-5 py-2.5 text-sm"
              >
                <Rocket className="h-4 w-4" />
                Boost a Token
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
