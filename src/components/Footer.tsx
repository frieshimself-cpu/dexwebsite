import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-7 w-7 rounded-full" />
              <span className="font-display text-lg font-semibold">
                MemeRocket<span className="text-primary">.</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              The playful token screener. Boost your token up the trending board from $10 and pay
              with SOL in seconds.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold">Explore</span>
              <Link to="/app" className="text-muted-foreground transition hover:text-foreground">
                Screener
              </Link>
              <a href="/#pricing" className="text-muted-foreground transition hover:text-foreground">
                Boost pricing
              </a>
              <a href="/#coin" className="text-muted-foreground transition hover:text-foreground">
                $ROCKET coin
              </a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold">Info</span>
              <a href="/#features" className="text-muted-foreground transition hover:text-foreground">
                Features
              </a>
              <a href="/#faq" className="text-muted-foreground transition hover:text-foreground">
                FAQ
              </a>
              <a
                href="https://pump.fun/coin/7cpPfNJVj7igL41C2mZmWS9yLHV7rebpcPaLwHZpump"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition hover:text-foreground"
              >
                $ROCKET on pump.fun ↗
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
          <p>
            © {new Date().getFullYear()} MemeRocket. Not financial advice. Token data is provided
            as-is from public market APIs. Boosts are paid promotion: they raise a token's position
            on MemeRocket's trending board only and are always disclosed with a ⚡ badge. A boost is
            not an endorsement — always DYOR before aping.
          </p>
        </div>
      </div>
    </footer>
  );
}
