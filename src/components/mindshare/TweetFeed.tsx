"use client";

import useSWR from "swr";
import type { MatchedTweet } from "@/lib/mindshare/types";
import { formatCompactNumber, formatRelativeTime } from "@/lib/mindshare/format";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TweetFeed() {
  const { data } = useSWR<{ tweets: MatchedTweet[] }>("/api/mindshare/tweets?limit=25", fetcher, {
    refreshInterval: 20000,
  });

  const tweets = data?.tweets ?? [];

  return (
    <div className="w-full rounded-2xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl px-6 py-5">
      <h2 className="text-sm uppercase tracking-widest text-slate-300 mb-4">Recent Mentions</h2>
      <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
        {tweets.length === 0 && (
          <p className="text-slate-600 text-sm py-8 text-center">No matched tweets yet.</p>
        )}
        {tweets.map((t) => (
          <a
            key={t.id}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-emerald-500/10 bg-slate-950/40 px-4 py-3 hover:border-emerald-500/30 hover:bg-slate-950/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300">
                <span className="text-emerald-300">@{t.authorHandle}</span>
              </span>
              <span className="text-[10px] text-slate-600">{formatRelativeTime(t.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-200 line-clamp-3">{t.text}</p>
            <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
              <span>♥ {formatCompactNumber(t.likeCount)}</span>
              <span>↻ {formatCompactNumber(t.retweetCount)}</span>
              <span>💬 {formatCompactNumber(t.replyCount)}</span>
              <span>👁 {formatCompactNumber(t.viewCount)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
