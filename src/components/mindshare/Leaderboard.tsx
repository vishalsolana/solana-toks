"use client";

import type { MindshareSnapshot } from "@/lib/mindshare/types";
import { formatCompactNumber, formatPct, formatRelativeTime } from "@/lib/mindshare/format";

export function Leaderboard({ snapshot }: { snapshot?: MindshareSnapshot }) {
  const rows = snapshot?.leaderboard ?? [];

  return (
    <div className="w-full rounded-2xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-emerald-500/10">
        <h2 className="text-sm uppercase tracking-widest text-slate-300">KOL Mindshare Leaderboard</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-emerald-500/10">
              <th className="px-6 py-3 font-normal">#</th>
              <th className="px-3 py-3 font-normal">KOL</th>
              <th className="px-3 py-3 font-normal text-right">Mindshare</th>
              <th className="px-3 py-3 font-normal text-right">Tweets</th>
              <th className="px-3 py-3 font-normal text-right">Likes</th>
              <th className="px-3 py-3 font-normal text-right">RTs</th>
              <th className="px-3 py-3 font-normal text-right">Views</th>
              <th className="px-6 py-3 font-normal text-right">Last post</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k, i) => (
              <tr key={k.handle} className="border-b border-emerald-500/5 hover:bg-emerald-900/10 transition-colors">
                <td className="px-6 py-3 text-slate-500">{i + 1}</td>
                <td className="px-3 py-3">
                  <a
                    href={`https://x.com/${k.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 group"
                  >
                    {k.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={k.avatar} alt="" className="w-6 h-6 rounded-full border border-emerald-500/20" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-emerald-900/40 border border-emerald-500/20" />
                    )}
                    <span className="text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {k.name}
                    </span>
                    <span className="text-slate-600 text-xs">@{k.handle}</span>
                  </a>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-emerald-300 font-semibold">{formatPct(k.mindsharePct)}</span>
                </td>
                <td className="px-3 py-3 text-right text-slate-400">{k.tweetCount}</td>
                <td className="px-3 py-3 text-right text-slate-400">{formatCompactNumber(k.likeCount)}</td>
                <td className="px-3 py-3 text-right text-slate-400">{formatCompactNumber(k.retweetCount)}</td>
                <td className="px-3 py-3 text-right text-slate-400">{formatCompactNumber(k.viewCount)}</td>
                <td className="px-6 py-3 text-right text-slate-500 text-xs">
                  {formatRelativeTime(k.lastTweetAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-600 text-sm">
                  No data yet — waiting on the first refresh cycle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
