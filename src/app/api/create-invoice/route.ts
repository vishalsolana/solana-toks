import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { PumpAgent } from "@pump-fun/agent-payments-sdk";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // Validate env vars
    const rpcUrl = process.env.SOLANA_RPC_URL;
    const agentMintStr = process.env.AGENT_TOKEN_MINT_ADDRESS;
    const currencyMintStr = process.env.CURRENCY_MINT;
    const priceAmount = process.env.PRICE_AMOUNT || "100000000"; // default 0.1 SOL

    if (!rpcUrl || !agentMintStr || !currencyMintStr) {
      console.error("Missing required environment variables");
      return NextResponse.json(
        { error: "Server misconfiguration: missing env vars" },
        { status: 500 }
      );
    }

    const connection = new Connection(rpcUrl, "confirmed");
    const agentMint = new PublicKey(agentMintStr);
    const currencyMint = new PublicKey(currencyMintStr);
    const userPublicKey = new PublicKey(walletAddress);

    // Generate unique invoice parameters
    const memo = String(Math.floor(Math.random() * 900_000_000_000) + 100_000);
    const now = Math.floor(Date.now() / 1000);
    const startTime = String(now - 60); // give 1 min buffer for clock skew
    const endTime = String(now + 86_400); // valid 24 hours

    const agent = new PumpAgent(agentMint, "mainnet", connection);

    const instructions = await agent.buildAcceptPaymentInstructions({
      user: userPublicKey,
      currencyMint,
      amount: priceAmount,
      memo,
      startTime,
      endTime,
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = userPublicKey;
    // Add a priority fee to help the tx land
    tx.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
      ...instructions
    );

    const serializedTx = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return NextResponse.json({
      transaction: serializedTx,
      invoice: {
        memo,
        startTime,
        endTime,
        amount: priceAmount,
        currencyMint: currencyMintStr,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-invoice]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
