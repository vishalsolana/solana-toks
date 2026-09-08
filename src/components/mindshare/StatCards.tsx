"use client";

import type { MindshareSnapshot } from "@/lib/mindshare/types";
import { formatCompactNumber } from "@/lib/mindshare/format";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-[150px] rounded-2xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function StatCards({ snapshot }: { snapshot?: MindshareSnapshot }) {
  const active = snapshot?.leaderboard.filter((k) => k.tweetCount > 0).length ?? 0;
  const top = snapshot?.leaderboard[0];

  return (
    <div className="flex flex-wrap gap-3 w-full">
      <Card label="Tracked KOLs" value={String(snapshot?.kolCount ?? 0)} sub={`${active} posting this window`} />
      <Card label="Matched tweets" value={formatCompactNumber(snapshot?.totalTweets ?? 0)} sub={`last ${snapshot?.windowDays ?? 7}d`} />
      <Card label="Total mindshare score" value={formatCompactNumber(snapshot?.totalScore ?? 0)} />
      <Card
        label="Top voice"
        value={top?.tweetCount ? `@${top.handle}` : "—"}
        sub={top?.tweetCount ? `${top.mindsharePct.toFixed(1)}% mindshare` : "no data yet"}
      />
    </div>
  );
}
