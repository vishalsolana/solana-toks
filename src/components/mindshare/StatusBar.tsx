"use client";

import { useState } from "react";
import type { MindshareSnapshot } from "@/lib/mindshare/types";
import { formatRelativeTime } from "@/lib/mindshare/format";
import { triggerRefresh } from "./useMindshareData";

const STATE_COLOR: Record<string, string> = {
  idle: "bg-emerald-400",
  running: "bg-yellow-400 animate-pulse",
  error: "bg-red-400",
};

const STATE_LABEL: Record<string, string> = {
  idle: "Live",
  running: "Refreshing…",
  error: "Error",
};

export function StatusBar({ snapshot }: { snapshot?: MindshareSnapshot }) {
  const [refreshing, setRefreshing] = useState(false);
  const state = snapshot?.status.state ?? "idle";

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${STATE_COLOR[state] ?? "bg-slate-500"}`} />
        <span className="text-sm text-slate-300 tracking-wide">
          {STATE_LABEL[state] ?? state}
        </span>
        <span className="text-xs text-slate-600">
          · updated {formatRelativeTime(snapshot?.updatedAt ?? null)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {snapshot?.keywords.map((kw) => (
          <span
            key={kw}
            className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-900/20"
          >
            {kw}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {!snapshot?.configured ? (
          <span className="text-xs text-amber-400">RETTIWT_API_KEY not set — see .env.local.example</span>
        ) : (
          snapshot?.status.lastError && (
            <span className="text-xs text-red-400 max-w-xs truncate" title={snapshot.status.lastError}>
              {snapshot.status.lastError}
            </span>
          )
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing || state === "running"}
          className="px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-300 text-xs uppercase tracking-widest hover:bg-emerald-900/30 hover:border-emerald-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {refreshing || state === "running" ? "Refreshing…" : "Refresh now"}
        </button>
      </div>
    </div>
  );
}
