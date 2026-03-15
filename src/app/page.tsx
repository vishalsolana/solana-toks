"use client";

import { useState, useCallback } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PaymentButton, PaymentStep } from "@/components/PaymentButton";
import { StepIndicator } from "@/components/StepIndicator";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [step, setStep] = useState<PaymentStep>("idle");
  const [stepMessage, setStepMessage] = useState<string>("");
  const [isRevealed, setIsRevealed] = useState(false);

  const handleSuccess = useCallback((number: number) => {
    setResult(number);
    setHistory((prev) => [number, ...prev].slice(0, 8));
    setIsRevealed(false);
    setTimeout(() => setIsRevealed(true), 50);
  }, []);

  const handleStepChange = useCallback((s: PaymentStep, msg?: string) => {
    setStep(s);
    setStepMessage(msg || "");
  }, []);

  const handleRollAgain = useCallback(() => {
    setResult(null);
    setStep("idle");
    setStepMessage("");
    setIsRevealed(false);
  }, []);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : null;

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-1.5 text-xs text-purple-300 mb-5 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Solana Mainnet
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="text-white">RNG</span>
            <span className="text-purple-400">.</span>
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              SOL
            </span>
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">
            Pay <span className="text-purple-300 font-bold">0.1 SOL</span> · Generate a provably fair random number
          </p>
        </div>

        {/* Main card */}
        <div
          className="w-full rounded-2xl border border-purple-500/20 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl"
          style={{ boxShadow: "0 0 60px rgba(139,92,246,0.08), 0 25px 50px rgba(0,0,0,0.5)" }}
        >
          {/* Wallet connect */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <WalletMultiButton />
            {connected && shortAddress && (
              <p className="text-xs text-slate-500 tracking-wider">
                Connected: <span className="text-purple-400">{shortAddress}</span>
              </p>
            )}
          </div>

          <div className="border-t border-purple-500/10 my-4" />

          {/* Result display */}
          {result !== null ? (
            <div className="flex flex-col items-center gap-6 py-2">
              <div className="text-xs text-slate-500 tracking-widest uppercase">Your number</div>
              <div
                className={`
                  relative flex items-center justify-center
                  w-48 h-48 rounded-full
                  border-2 border-purple-500/40
                  bg-gradient-to-br from-slate-800 to-slate-900
                  transition-all duration-700
                  ${isRevealed ? "opacity-100 scale-100" : "opacity-0 scale-75"}
                `}
                style={{
                  boxShadow: isRevealed
                    ? "0 0 40px rgba(139,92,246,0.5), 0 0 80px rgba(139,92,246,0.2), inset 0 0 30px rgba(139,92,246,0.1)"
                    : "none",
                  transform: isRevealed ? "scale(1)" : "scale(0.75)",
                }}
              >
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-purple-400/20 animate-spin-slow" />
                {/* Number */}
                <span
                  className="text-6xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {result}
                </span>
              </div>

              <div className="text-center">
                <p className="text-xs text-green-400 flex items-center gap-1.5 justify-center mb-1">
                  <span>✓</span> Payment verified on-chain
                </p>
                <p className="text-xs text-slate-600">Range: 0 – 1000</p>
              </div>

              <button
                onClick={handleRollAgain}
                className="px-8 py-3 rounded-xl border border-purple-500/30 text-purple-300 text-sm tracking-widest uppercase hover:bg-purple-900/30 hover:border-purple-400/50 transition-all"
              >
                Roll Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Dice illustration */}
              {step === "idle" && (
                <div className="flex flex-col items-center gap-5 mb-2">
                  <DiceIllustration />
                  <div className="text-center space-y-1.5">
                    <p className="text-slate-300 text-sm font-semibold">How it works</p>
                    <ol className="text-xs text-slate-500 space-y-1 text-left list-none">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">①</span>
                        Connect your Solana wallet
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">②</span>
                        Pay 0.1 SOL — transaction built &amp; verified server-side
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">③</span>
                        Receive a random number between 0 and 1000
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Step indicator */}
              <StepIndicator currentStep={step} message={stepMessage} />

              <PaymentButton
                onSuccess={handleSuccess}
                onStepChange={handleStepChange}
              />

              {!connected && (
                <p className="text-xs text-slate-600 text-center">
                  Connect your wallet to get started
                </p>
              )}
            </div>
          )}
        </div>

        {/* Roll history */}
        {history.length > 0 && (
          <div className="w-full">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 text-center">
              Recent rolls
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {history.map((n, i) => (
                <span
                  key={i}
                  className={`
                    px-3 py-1 rounded-lg text-sm font-mono border
                    ${i === 0
                      ? "bg-purple-900/40 border-purple-500/40 text-purple-200"
                      : "bg-slate-800/40 border-slate-700/40 text-slate-500"}
                  `}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-700 text-center mt-4">
          Powered by{" "}
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-700 hover:text-purple-500 transition-colors"
          >
            pump.fun
          </a>{" "}
          tokenized agent payments
        </p>
      </div>
    </main>
  );
}

function DiceIllustration() {
  return (
    <div className="relative w-24 h-24 animate-[float_6s_ease-in-out_infinite]">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dice face */}
        <rect
          x="8" y="8" width="80" height="80" rx="16"
          fill="url(#diceGrad)"
          stroke="rgba(139,92,246,0.5)"
          strokeWidth="1.5"
        />
        {/* Dots — showing "6" face */}
        <circle cx="30" cy="30" r="6" fill="rgba(167,139,250,0.9)" />
        <circle cx="66" cy="30" r="6" fill="rgba(167,139,250,0.9)" />
        <circle cx="30" cy="48" r="6" fill="rgba(167,139,250,0.9)" />
        <circle cx="66" cy="48" r="6" fill="rgba(167,139,250,0.9)" />
        <circle cx="30" cy="66" r="6" fill="rgba(167,139,250,0.9)" />
        <circle cx="66" cy="66" r="6" fill="rgba(167,139,250,0.9)" />
        <defs>
          <linearGradient id="diceGrad" x1="8" y1="8" x2="88" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e1b4b" />
            <stop offset="1" stopColor="#2d1b69" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
