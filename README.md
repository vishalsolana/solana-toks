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
