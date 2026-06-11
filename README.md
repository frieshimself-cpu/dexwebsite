# 🚀 MemeRocket

A playful token screener where projects can buy **boosts** to climb the trending board and
**banner ads** to get seen — at a fraction of what the big screeners charge ($1 per boost vs
~$10 elsewhere). Payments are made in SOL and verified **on-chain, automatically**.

## 🔐 Key security

This codebase contains **no private keys** and never needs one. The server only knows the
**public** receive address (`RECEIVE_WALLET`) and *watches* the chain for incoming
transfers — nothing in this project can move funds, so there is nothing here to steal.

Rules to keep it that way:

1. Never put a private key in `.env`, the code, Railway variables, or anywhere else in
   this project — no feature will ever require it.
2. Receiving payments only needs the public address. Private keys stay in your wallet app.
3. Sweep accumulated funds out of the receive wallet regularly, and rotate to a fresh
   address by changing `RECEIVE_WALLET` whenever you like — zero code changes needed.

## What's inside

- **Frontend** — React + TypeScript + Tailwind + Framer Motion. Full-screen video hero,
  starfield canvas, animated trending board, boost purchase flow with Solana Pay QR,
  confetti on activation, golden-ticker rows for 500x boosts.
- **Backend** — Express + SQLite (`better-sqlite3`).
  - Live trending data from GeckoTerminal, token lookups from DexScreener's public API
    (falls back to clearly-labelled demo data offline).
  - Boost & ad orders with unique payment amounts + Solana Pay reference keys.
  - A payment watcher that polls the chain every 25s and activates purchases automatically.
    Manual "verify by signature" fallback included.
  - Boosts multiply a token's trending score for 24h and are always disclosed with a ⚡ badge.

## Run it

```bash
npm install
cp .env.example .env   # then edit RECEIVE_WALLET / ADMIN_KEY
npm run dev            # dev: client on :5173, API on :8787
```

Production:

```bash
npm run build          # builds the frontend into dist/
npm start              # serves website + API on PORT (default 8787)
```

Deploy anywhere that runs Node 20+ (Railway, Render, Fly.io, a $5 VPS). The SQLite database
lives in `data/` — keep that directory persistent. For reliable payment detection use a free
dedicated RPC (helius.dev / quicknode) in `RPC_URL` instead of the public mainnet endpoint.

## Pricing knobs

Boost packages and ad pricing live in `server/config.ts` (`BOOST_PACKAGES`, `adPricePerDay`).
The boost-to-score multiplier is `boostFactor()` in `server/marketdata.ts`.

## Admin

Open **`/admin`** on the site and enter your `ADMIN_KEY` to see revenue, orders, active
boosts and ads (auto-refreshes). The raw APIs are `GET /api/admin/overview` and
`GET /api/admin/orders` with header `x-admin-key: $ADMIN_KEY`.

## Payment edge cases handled

- Solana Pay reference keys for instant matching, plus amount-matching for plain wallet
  transfers, plus manual verify-by-signature.
- Quotes "expire" after 60 min, but payments are still honored for 6 more hours if the
  SOL verifiably arrived (late payers never lose money).
- Each pending order gets a unique lamport amount (collision-proof dust sweep).
- Used transaction signatures can never be replayed across orders.

---

<p align="center">
  <img src="public/logo.png" alt="MemeRocket logo" width="220" />
</p>
<p align="center"><b>MemeRocket</b> — strap a rocket to your token 🚀</p>
