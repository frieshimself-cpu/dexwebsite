import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import {
  X,
  Zap,
  Crown,
  Megaphone,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Rocket,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OrderPublic, SiteConfig, TokenLookup } from "@shared/types";
import { api, isSolanaAddress } from "../lib/api";
import { fmtUsd, solAmount, shortAddr, timeLeft } from "../lib/format";
import { useBoostModal } from "../context/BoostModalContext";

type Step = "configure" | "pay" | "done";

function CopyChip({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs transition hover:border-primary/40"
      title="Copy"
    >
      <span className="truncate">{label ?? value}</span>
      {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}

export default function BoostModal() {
  const modal = useBoostModal();
  const navigate = useNavigate();

  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [step, setStep] = useState<Step>("configure");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  // configure state
  const [packageId, setPackageId] = useState<string>("");
  const [ca, setCa] = useState("");
  const [lookup, setLookup] = useState<TokenLookup | null>(null);
  const [looking, setLooking] = useState(false);
  const [adDays, setAdDays] = useState(3);
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adLinkUrl, setAdLinkUrl] = useState("");

  // payment state
  const [order, setOrder] = useState<OrderPublic | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api.config().then(setConfig).catch(() => {});
  }, []);

  // reset whenever the modal opens
  useEffect(() => {
    if (modal.open) {
      setStep("configure");
      setError("");
      setOrder(null);
      setSignature("");
      setManualOpen(false);
      setCa(modal.prefillToken ?? "");
      setPackageId(modal.prefillPackageId ?? config?.packages.find((p) => p.popular)?.id ?? "boost-50");
    }
  }, [modal.open]); // eslint-disable-line react-hooks/exhaustive-deps

  // debounce token lookup
  useEffect(() => {
    setLookup(null);
    if (!isSolanaAddress(ca)) return;
    setLooking(true);
    const t = setTimeout(() => {
      api
        .token(ca.trim())
        .then(setLookup)
        .catch(() => setLookup(null))
        .finally(() => setLooking(false));
    }, 450);
    return () => clearTimeout(t);
  }, [ca]);

  // poll order status while paying
  useEffect(() => {
    if (step !== "pay" || !order) return;
    const t = setInterval(async () => {
      setNow(Date.now());
      try {
        const { order: fresh } = await api.order(order.id);
        setOrder(fresh);
        if (fresh.status === "paid") {
          setStep("done");
        }
      } catch {
        // transient — keep polling
      }
    }, 5000);
    return () => clearInterval(t);
  }, [step, order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // confetti on success
  useEffect(() => {
    if (step !== "done") return;
    const fire = (x: number) =>
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { x, y: 0.7 },
        colors: ["#c8f135", "#7c5cff", "#38bdf8", "#ff5cd2", "#ffd24a"],
        zIndex: 200,
      });
    fire(0.25);
    setTimeout(() => fire(0.75), 250);
    setTimeout(() => fire(0.5), 500);
  }, [step]);

  const selectedPackage = useMemo(
    () => config?.packages.find((p) => p.id === packageId),
    [config, packageId]
  );

  const totalUsd = modal.mode === "boost" ? selectedPackage?.usd ?? 0 : adDays * (config?.adPricePerDay ?? 25);

  const canSubmit =
    isSolanaAddress(ca) &&
    !creating &&
    (modal.mode === "boost"
      ? !!selectedPackage
      : /^https?:\/\/.{3,}/.test(adImageUrl) && /^https?:\/\/.{3,}/.test(adLinkUrl) && adDays >= 1);

  const createOrder = useCallback(async () => {
    if (!canSubmit) return;
    setCreating(true);
    setError("");
    try {
      const body =
        modal.mode === "boost"
          ? { type: "boost" as const, tokenAddress: ca.trim(), packageId }
          : { type: "ad" as const, tokenAddress: ca.trim(), adDays, adImageUrl, adLinkUrl };
      const { order } = await api.createOrder(body);
      setOrder(order);
      setStep("pay");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the order");
    } finally {
      setCreating(false);
    }
  }, [canSubmit, modal.mode, ca, packageId, adDays, adImageUrl, adLinkUrl]);

  const verifyManually = async () => {
    if (!order || !signature.trim()) return;
    setVerifying(true);
    setError("");
    try {
      const { order: fresh } = await api.verifyOrder(order.id, signature.trim());
      setOrder(fresh);
      if (fresh.status === "paid") setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const expired = order ? order.payment.expiresAt < now && order.status === "pending" : false;

  return (
    <AnimatePresence>
      {modal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={modal.close}
        >
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-background p-6 shadow-2xl shadow-primary/5 sm:rounded-3xl"
          >
            <button
              onClick={modal.close}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* ------------------------------ configure ------------------------------ */}
            {step === "configure" && (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  {modal.mode === "boost" ? (
                    <Zap className="h-5 w-5 text-primary" />
                  ) : (
                    <Megaphone className="h-5 w-5 text-rocket-pink" />
                  )}
                  <h2 className="font-display text-xl font-semibold">
                    {modal.mode === "boost" ? "Boost a token" : "Book a banner ad"}
                  </h2>
                </div>
                <p className="mb-5 text-sm text-muted-foreground">
                  {modal.mode === "boost"
                    ? "Pick your thrust level, paste the CA, pay with SOL. Live in seconds."
                    : `$${config?.adPricePerDay ?? 25}/day on the screener. Any image, your link.`}
                </p>

                {modal.mode === "boost" && (
                  <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {(config?.packages ?? []).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPackageId(p.id)}
                        className={`relative rounded-xl border p-3 text-left transition ${
                          packageId === p.id
                            ? p.golden
                              ? "border-gold bg-gold/10"
                              : "border-primary bg-primary/10"
                            : "border-border bg-muted/40 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {p.golden ? (
                            <Crown className="h-4 w-4 text-gold" />
                          ) : (
                            <Zap className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-display font-bold">{p.boosts}x</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{p.label}</div>
                        <div className="mt-1.5 font-semibold">${p.usd}</div>
                      </button>
                    ))}
                  </div>
                )}

                <label className="mb-1.5 block text-sm font-medium">Token contract address (Solana)</label>
                <input
                  value={ca}
                  onChange={(e) => setCa(e.target.value)}
                  placeholder="e.g. 7cpPfNJVj7igL41C2mZmWS9yLHV7rebpcPaLwHZpump"
                  spellCheck={false}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 font-mono text-sm outline-none transition focus:border-primary/60"
                />

                {/* live token preview */}
                {looking && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Looking up token…
                  </div>
                )}
                {lookup && !looking && (
                  <div
                    className={`mt-3 flex items-center gap-3 rounded-xl border p-3 ${
                      lookup.found ? "border-primary/40 bg-primary/5" : "border-amber-500/40 bg-amber-500/5"
                    }`}
                  >
                    {lookup.imageUrl ? (
                      <img src={lookup.imageUrl} alt="" className="h-10 w-10 rounded-full" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold">
                        {lookup.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">{lookup.name}</span>
                        <span className="text-xs text-muted-foreground">{lookup.symbol}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lookup.found
                          ? `${fmtUsd(lookup.priceUsd)} · MC ${fmtUsd(lookup.marketCapUsd)}${
                              lookup.activeBoosts > 0 ? ` · ⚡${lookup.activeBoosts} active` : ""
                            }`
                          : "No live market data found — double-check the address before paying."}
                      </div>
                    </div>
                    {!lookup.found && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
                  </div>
                )}

                {modal.mode === "ad" && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Banner image URL</label>
                      <input
                        value={adImageUrl}
                        onChange={(e) => setAdImageUrl(e.target.value)}
                        placeholder="https://… (wide banner works best)"
                        className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none transition focus:border-primary/60"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Click-through link</label>
                      <input
                        value={adLinkUrl}
                        onChange={(e) => setAdLinkUrl(e.target.value)}
                        placeholder="https://your-site-or-telegram"
                        className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none transition focus:border-primary/60"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Duration: <span className="text-primary">{adDays} day{adDays > 1 ? "s" : ""}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={adDays}
                        onChange={(e) => setAdDays(Number(e.target.value))}
                        className="w-full accent-[hsl(73,98%,57%)]"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  onClick={createOrder}
                  disabled={!canSubmit}
                  className="btn-primary mt-5 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Rocket className="h-5 w-5" />
                      Continue — pay {fmtUsd(totalUsd)} in SOL
                    </>
                  )}
                </button>
              </div>
            )}

            {/* --------------------------------- pay --------------------------------- */}
            {step === "pay" && order && (
              <div className="text-center">
                <h2 className="font-display text-xl font-semibold">
                  {order.type === "boost" ? `Pay for your ${order.boosts}x boost` : "Pay for your ad"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.tokenSymbol ? `${order.tokenSymbol} · ` : ""}
                  {fmtUsd(order.usd)} → send exactly
                </p>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="font-display text-3xl font-bold text-primary">
                    {solAmount(order.payment.amountSol)}
                  </span>
                  <span className="text-lg text-muted-foreground">SOL</span>
                  <CopyChip value={solAmount(order.payment.amountSol)} label="copy" />
                </div>

                <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-3">
                  <QRCodeSVG value={order.payment.solanaPayUrl} size={196} marginSize={1} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Scan with Phantom / Solflare / any Solana Pay wallet
                </p>

                <div className="mt-4 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground">or send manually to</span>
                  <CopyChip value={order.payment.recipient} label={shortAddr(order.payment.recipient, 8)} />
                  <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                    Send the <span className="text-foreground">exact amount</span> (the tiny decimals
                    identify your order) and your {order.type === "boost" ? "boost" : "ad"} activates
                    automatically.
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 p-3 text-sm">
                  {expired ? (
                    <span className="text-rose-300">
                      Order expired — close and start a new one (don't send now).
                    </span>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>
                        Watching the chain for your payment… <span className="text-muted-foreground">(expires in {timeLeft(order.payment.expiresAt)})</span>
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setManualOpen((v) => !v)}
                  className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  Paid but not detected? Verify by transaction signature
                  <ChevronDown className={`h-3.5 w-3.5 transition ${manualOpen ? "rotate-180" : ""}`} />
                </button>
                {manualOpen && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Paste transaction signature"
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 font-mono text-xs outline-none focus:border-primary/60"
                    />
                    <button
                      onClick={verifyManually}
                      disabled={verifying || !signature.trim()}
                      className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-40"
                    >
                      {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-left text-sm text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------- done -------------------------------- */}
            {step === "done" && order && (
              <div className="py-4 text-center">
                <motion.div
                  initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="mx-auto mb-4 w-fit"
                >
                  <img src="/logo.png" alt="" className="h-24 w-24 rounded-full drop-shadow-[0_0_40px_rgba(200,241,53,0.45)]" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold">
                  {order.type === "boost" ? (
                    <>
                      {order.boosts}x boost <span className="text-primary">activated!</span>
                    </>
                  ) : (
                    <>
                      Ad is <span className="text-primary">live!</span>
                    </>
                  )}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {order.type === "boost"
                    ? `${order.tokenSymbol ?? "Your token"} is climbing the trending board for the next 24 hours. ⚡`
                    : "Your banner is now rotating on the screener."}
                </p>
                {order.signature && (
                  <a
                    href={`https://solscan.io/tx/${order.signature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      modal.close();
                      navigate(order.type === "boost" ? `/token/${order.tokenAddress}` : "/app");
                    }}
                    className="btn-primary px-6 py-3 text-sm"
                  >
                    <Rocket className="h-4 w-4" />
                    {order.type === "boost" ? "Watch it climb" : "See it live"}
                  </button>
                  <button onClick={modal.close} className="btn-secondary px-6 py-3 text-sm">
                    Done
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
