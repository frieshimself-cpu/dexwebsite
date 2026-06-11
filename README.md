# 🚀 MemeRocket

A playful token screener where projects can buy **boosts** to climb the trending board and
**banner ads** to get seen — at a fraction of what the big screeners charge ($1 per boost vs
~$10 elsewhere). Payments are made in SOL and verified **on-chain, automatically**.

## ⚠️ Security first — read this

A wallet **private key was shared in the chat where this project was built. Treat that wallet
as compromised**:

1. Create a brand-new wallet (Phantom → create new account, or `solana-keygen new`).
2. Move any funds from the old wallet to the new one.
3. Put the **new public address** in `.env` as `RECEIVE_WALLET`.
4. Never share a private key with anyone or any website again — receiving payments only
   requires the *public* address. The private key stays in your wallet app, period.

This codebase contains **no private keys** and never needs one: it only *watches* the chain
for incoming transfers to your public address.

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

`GET /api/admin/orders` with header `x-admin-key: $ADMIN_KEY` lists all orders/payments.

## Logo

`public/logo.svg` is a hand-made stand-in. Drop your real PNG at `public/logo.png` and swap
the references, or just replace the contents of `logo.svg`.
<img width="512" height="512" alt="2wdadawdawdawdQ" src="https://github.com/user-attachments/assets/a58c059e-78f4-49f3-a83b-cc15aa926c5d" />
