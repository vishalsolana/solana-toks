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

    if (!memo || !startTime || !endTime || !amount || !currencyMintStr) {
      return NextResponse.json(
        { error: "Incomplete invoice parameters" },
        { status: 400 }
      );
    }

    const agentMintStr = process.env.AGENT_TOKEN_MINT_ADDRESS;
    const rpcUrl = process.env.SOLANA_RPC_URL;

    if (!agentMintStr || !rpcUrl) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const connection = new Connection(rpcUrl, "confirmed");
    const agentMint = new PublicKey(agentMintStr);
    const agent = new PumpAgent(agentMint, "mainnet", connection);

    const invoiceParams = {
      user: new PublicKey(walletAddress),
      currencyMint: new PublicKey(currencyMintStr),
      amount: Number(amount),
      memo: Number(memo),
      startTime: Number(startTime),
      endTime: Number(endTime),
    };

    // Retry up to 12 times (24 seconds) to handle confirmation delay
    let verified = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      verified = await agent.validateInvoicePayment(invoiceParams);
      if (verified) break;
      if (attempt < 11) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!verified) {
      return NextResponse.json(
        { verified: false, error: "Payment not found on-chain" },
        { status: 402 }
      );
    }

    return NextResponse.json({ verified: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[verify-payment]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
