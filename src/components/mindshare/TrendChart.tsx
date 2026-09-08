"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MindshareSnapshot } from "@/lib/mindshare/types";
import { formatCompactNumber } from "@/lib/mindshare/format";

interface TooltipPayloadItem {
  payload: { time: string; totalScore: number; totalTweets: number };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-xl">
      <p className="text-slate-400 mb-0.5">{p.time}</p>
      <p className="text-emerald-300 font-semibold">{formatCompactNumber(p.totalScore)} mindshare score</p>
      <p className="text-slate-500">{p.totalTweets} tweets</p>
    </div>
  );
}

export function TrendChart({ snapshot }: { snapshot?: MindshareSnapshot }) {
  const points = (snapshot?.history ?? []).map((h) => ({
    time: new Date(h.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    totalScore: h.totalScore,
    totalTweets: h.totalTweets,
  }));

  return (
    <div className="w-full rounded-2xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl px-6 py-5">
      <h2 className="text-sm uppercase tracking-widest text-slate-300 mb-4">Mindshare Volume Over Time</h2>
      {points.length < 2 ? (
        <p className="text-slate-600 text-sm py-8 text-center">
          Trend appears after a couple of refresh cycles.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={points} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid stroke="rgba(16,185,129,0.08)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={{ stroke: "rgba(16,185,129,0.15)" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "rgba(16,185,129,0.15)" }}
              tickLine={false}
              tickFormatter={(v: number) => formatCompactNumber(v)}
              width={40}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(16,185,129,0.3)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="totalScore"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
