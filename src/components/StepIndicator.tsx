"use client";

import { PaymentStep } from "./PaymentButton";

interface StepIndicatorProps {
  currentStep: PaymentStep;
  message?: string;
}

const STEPS: { id: PaymentStep; label: string; icon: string }[] = [
  { id: "creating-invoice", label: "Build Invoice", icon: "📋" },
  { id: "awaiting-signature", label: "Sign & Send", icon: "✍️" },
  { id: "verifying", label: "Verify On-Chain", icon: "🔍" },
  { id: "generating", label: "Generate Number", icon: "🎲" },
];

const ACTIVE_STEPS = new Set<PaymentStep>([
  "creating-invoice",
  "awaiting-signature",
  "verifying",
  "generating",
]);

function stepIndex(step: PaymentStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

export function StepIndicator({ currentStep, message }: StepIndicatorProps) {
  if (currentStep === "idle" || currentStep === "done") return null;

  const current = stepIndex(currentStep);
  const isError = currentStep === "error";

  return (
    <div className="w-full max-w-sm mx-auto mt-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((step, idx) => {
          const done = !isError && current > idx;
          const active = !isError && current === idx;
          const pending = isError || current < idx;

          return (
            <div key={step.id} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm
                  transition-all duration-300 border-2
                  ${
                    done
                      ? "bg-green-500 border-green-400 text-white scale-90"
                      : active
                      ? "bg-purple-600 border-purple-400 text-white scale-110 shadow-lg shadow-purple-500/40 animate-pulse"
                      : isError
                      ? "bg-red-900/30 border-red-700/40 text-red-500"
                      : "bg-slate-800/60 border-slate-600/40 text-slate-500"
                  }
                `}
              >
                {done ? "✓" : step.icon}
              </div>
              <span
                className={`text-[10px] text-center leading-tight tracking-wide
                  ${done ? "text-green-400" : active ? "text-purple-300" : "text-slate-600"}
                `}
              >
                {step.label}
              </span>
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="absolute" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {!isError && ACTIVE_STEPS.has(currentStep) && (
        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
            style={{
              width: `${((current + 0.5) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      )}

      {message && (
        <p className="text-center text-xs text-slate-400 mt-2 font-mono">
          {message}
        </p>
      )}
    </div>
  );
}
