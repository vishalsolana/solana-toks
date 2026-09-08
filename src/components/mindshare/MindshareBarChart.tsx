"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MindshareSnapshot as Snapshot } from "@/lib/mindshare/types";

// Single-hue sequential ramp (emerald) — magnitude encoding for one measure, darkest = highest mindshare.
const RAMP = ["#022c22", "#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];

interface TooltipPayloadItem {
  payload: { label: string; handle: string; mindsharePct: number };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-xl">
      <p className="text-slate-400 mb-0.5">@{p.handle}</p>
      <p className="text-emerald-300 font-semibold">{p.mindsharePct.toFixed(2)}% mindshare</p>
    </div>
  );
}

export function MindshareBarChart({ snapshot }: { snapshot?: Snapshot }) {
  const top = (snapshot?.leaderboard ?? [])
    .filter((k) => k.tweetCount > 0)
    .slice(0, 10)
    .map((k) => ({ label: `@${k.handle}`, handle: k.handle, mindsharePct: k.mindsharePct }));

  return (
    <div className="w-full rounded-2xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl px-6 py-5">
      <h2 className="text-sm uppercase tracking-widest text-slate-300 mb-4">Top 10 Share of Voice</h2>
      {top.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No matched tweets yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, top.length * 34)}>
          <BarChart data={top} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="rgba(16,185,129,0.08)" />
            <XAxis
              type="number"
              tickFormatter={(v: number) => `${v}%`}
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "rgba(16,185,129,0.15)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "rgba(16,185,129,0.15)" }}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
            <Bar dataKey="mindsharePct" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {top.map((_, i) => (
                <Cell key={i} fill={RAMP[Math.min(i, RAMP.length - 1)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
