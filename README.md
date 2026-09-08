# Solana RNG — Pay to Roll

A Next.js app that gates access to a random number generator behind a **0.1 SOL** Solana payment, verified server-side using the `@pump-fun/agent-payments-sdk`.

## Architecture

```
User connects wallet
       ↓
POST /api/create-invoice   — Server builds unsigned transaction, returns base64 + invoice params
       ↓
Wallet signs & sends tx    — Client deserialiizes, user approves in Phantom/Backpack/Solflare
       ↓
POST /api/verify-payment   — Server calls validateInvoicePayment() with retry loop (up to 24s)
       ↓
POST /api/generate-number  — Server re-verifies, then returns Math.random() * 1001
       ↓
Number displayed to user
```

**The service is never delivered without server-side payment verification.** Clients cannot bypass this by faking a transaction signature.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Solana RPC (supports sendTransaction — do NOT use api.mainnet-beta.solana.com)
SOLANA_RPC_URL=https://rpc.solanatracker.io/public
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.solanatracker.io/public

# Your pump.fun tokenized agent token mint address
# Go to https://pump.fun and launch your agent coin to get this
AGENT_TOKEN_MINT_ADDRESS=<YOUR_AGENT_MINT_ADDRESS>

# Wrapped SOL mint (for SOL payments)
CURRENCY_MINT=So11111111111111111111111111111111111111112

# 0.1 SOL = 100,000,000 lamports (9 decimals)
PRICE_AMOUNT=100000000
```

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

## Getting a pump.fun Agent Token Mint

1. Visit [https://pump.fun](https://pump.fun)
2. Launch your agent coin (creates a token with a mint address)
3. Copy the mint address and set it as `AGENT_TOKEN_MINT_ADDRESS`

## Switching to USDC

1. Change `CURRENCY_MINT` to `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
2. Change `PRICE_AMOUNT` to the USDC amount × 1,000,000 (e.g. `100000` = 0.1 USDC)
3. Update the button label in `src/app/page.tsx`

## Robinhood Chain Mindshare Dashboard (`/mindshare`)

A real-time "mindshare" / share-of-voice dashboard: track up to 100 crypto KOLs
on X (Twitter) and see who's driving the conversation around Robinhood Chain.

### How it works

```
src/data/kols.json          — the 100 tracked KOL handles + keywords to match
       ↓
scheduler.ts (every N min)  — batches KOLs, searches X via rettiwt-api for
                               tweets from those handles matching the keywords
       ↓
store.ts                    — dedupes tweets by id, keeps a rolling window,
                               persists to ./data/mindshare-store.json
       ↓
aggregate.ts                — scores each tweet by engagement, sums per KOL,
                               computes mindshare % = KOL score / total score
       ↓
/api/mindshare, /stream     — dashboard polls + subscribes to SSE for live updates
```

### Setup

1. Get a Rettiwt-api session key (a serialized X session — use a dedicated,
   non-primary account, since this uses X's internal API rather than the
   official paid API):
   ```bash
   npx rettiwt-api auth login -e <email> -u <username> -p <password>
   ```
   Copy the printed key into `.env.local` as `RETTIWT_API_KEY`.

2. Edit `src/data/kols.json`:
   - Replace the sample `kols` array with your real list of up to 100 handles
     (no `@`), optionally with a display `name`.
   - Adjust `chain.keywords` — tweets from tracked KOLs are only counted if
     they contain one of these phrases/hashtags/cashtags.

3. Run the app (`npm run dev` or `npm run build && npm start`). A background
   scheduler starts automatically (`instrumentation.ts`) and refreshes every
   `MINDSHARE_REFRESH_MINUTES` (default 5).

4. Open [http://localhost:3000/mindshare](http://localhost:3000/mindshare).

### Mindshare scoring

Each matching tweet gets a score = `1 + likes + 4×retweets + 3×quotes + 2×replies + 5×log10(views+1)`
(views are log-scaled since raw view counts otherwise drown out engagement).
A KOL's mindshare % is their summed score divided by the total score across
all tracked KOLs, over a rolling `MINDSHARE_WINDOW_DAYS` window (default 7).

### Serverless / production note

The built-in scheduler uses `setInterval` in the Node process, which works for
a long-running server (`next start`) but not for stateless serverless
deployments. For those, set `MINDSHARE_REFRESH_SECRET` and point an external
cron (Vercel Cron, GitHub Actions) at `GET/POST /api/mindshare/refresh` with
an `Authorization: Bearer <secret>` header instead.

### Rate limits

X aggressively rate-limits and can lock accounts that scrape too fast. Batch
size, pages-per-batch, inter-request delay, and refresh interval are all
tunable via env vars (see `.env.local.example`) — turn them down if you see
errors in the dashboard's status bar.

## Supported Wallets

- Phantom
- Solflare  
- Backpack

## Tech Stack

- **Next.js 14** (App Router)
- **@pump-fun/agent-payments-sdk** — invoice creation & verification
- **@solana/web3.js** — transaction building & sending
- **@solana/wallet-adapter-react** — wallet connection
- **Tailwind CSS** + Space Mono font
