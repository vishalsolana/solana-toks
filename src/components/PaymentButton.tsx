"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

export type PaymentStep =
  | "idle"
  | "creating-invoice"
  | "awaiting-signature"
  | "verifying"
  | "generating"
  | "done"
  | "error";

interface InvoiceData {
  memo: string;
  startTime: string;
  endTime: string;
  amount: string;
  currencyMint: string;
}

interface PaymentButtonProps {
  onSuccess: (number: number) => void;
  onStepChange?: (step: PaymentStep, message?: string) => void;
}

async function signAndSendPayment(
  txBase64: string,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  connection: import("@solana/web3.js").Connection
): Promise<string> {
  const tx = Transaction.from(Buffer.from(txBase64, "base64"));
  const signedTx = await signTransaction(tx);

  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    { signature, ...latestBlockhash },
    "confirmed"
  );

  return signature;
}

export function PaymentButton({ onSuccess, onStepChange }: PaymentButtonProps) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [step, setStep] = useState<PaymentStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const updateStep = useCallback(
    (s: PaymentStep, msg?: string) => {
      setStep(s);
      onStepChange?.(s, msg);
    },
    [onStepChange]
  );

  const handlePayAndGenerate = useCallback(async () => {
    if (!publicKey || !signTransaction) return;

    setErrorMessage("");

    try {
      // Step 1: Ask server to build the invoice + unsigned transaction
      updateStep("creating-invoice", "Building invoice on server…");
      const invoiceRes = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });

      if (!invoiceRes.ok) {
        const { error } = await invoiceRes.json();
        throw new Error(error || "Failed to create invoice");
      }

      const { transaction: txBase64, invoice } =
        (await invoiceRes.json()) as { transaction: string; invoice: InvoiceData };

      // Step 2: Present transaction to wallet for signing + send on-chain
      updateStep("awaiting-signature", "Please approve in your wallet…");
      const signature = await signAndSendPayment(
        txBase64,
        signTransaction,
        connection
      );

      console.log("Transaction confirmed:", signature);

      // Step 3: Server verifies payment before delivering service
      updateStep("verifying", "Verifying payment on-chain…");
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toBase58(), invoice }),
      });

      if (!verifyRes.ok) {
        const { error } = await verifyRes.json();
        throw new Error(error || "Payment verification failed");
      }

      // Step 4: Generate random number (server verifies payment once more)
      updateStep("generating", "Generating your number…");
      const generateRes = await fetch("/api/generate-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toBase58(), invoice }),
      });

      if (!generateRes.ok) {
        const { error } = await generateRes.json();
        throw new Error(error || "Failed to generate number");
      }

      const { number } = (await generateRes.json()) as { number: number };

      updateStep("done");
      onSuccess(number);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(msg);
      updateStep("error", msg);
    }
  }, [publicKey, signTransaction, connection, onSuccess, updateStep]);

  const isLoading =
    step === "creating-invoice" ||
    step === "awaiting-signature" ||
    step === "verifying" ||
    step === "generating";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handlePayAndGenerate}
        disabled={isLoading || !publicKey}
        className={`
          relative overflow-hidden px-10 py-4 rounded-xl font-bold text-lg tracking-widest uppercase
          transition-all duration-200 w-full max-w-xs
          ${
            isLoading
              ? "bg-purple-800/50 cursor-not-allowed text-purple-300 border border-purple-700/50"
              : "bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 border border-purple-400/30"
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerIcon />
            {step === "creating-invoice" && "Building…"}
            {step === "awaiting-signature" && "Waiting for wallet…"}
            {step === "verifying" && "Verifying…"}
            {step === "generating" && "Generating…"}
          </span>
        ) : (
          "Pay 0.1 SOL & Roll"
        )}
      </button>

      {step === "error" && errorMessage && (
        <p className="text-red-400 text-xs text-center max-w-xs font-mono">
          ⚠ {errorMessage}
        </p>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="w-5 h-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
