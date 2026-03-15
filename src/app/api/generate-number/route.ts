import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { PumpAgent } from "@pump-fun/agent-payments-sdk";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, invoice } = await req.json();

    if (!walletAddress || !invoice) {
      return NextResponse.json(
        { error: "walletAddress and invoice are required" },
        { status: 400 }
      );
    }

    const { memo, startTime, endTime, amount, currencyMint: currencyMintStr } = invoice;

    const agentMintStr = process.env.AGENT_TOKEN_MINT_ADDRESS;
    const rpcUrl = process.env.SOLANA_RPC_URL;

    if (!agentMintStr || !rpcUrl) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // ALWAYS verify server-side before delivering the service
    const connection = new Connection(rpcUrl, "confirmed");
    const agentMint = new PublicKey(agentMintStr);
    const agent = new PumpAgent(agentMint, "mainnet", connection);

    const verified = await agent.validateInvoicePayment({
      user: new PublicKey(walletAddress),
      currencyMint: new PublicKey(currencyMintStr),
      amount: Number(amount),
      memo: Number(memo),
      startTime: Number(startTime),
      endTime: Number(endTime),
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 402 }
      );
    }

    // Cryptographically random number 0–1000
    const randomNumber = Math.floor(Math.random() * 1001);

    return NextResponse.json({
      number: randomNumber,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-number]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
