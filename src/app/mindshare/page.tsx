"use client";

import Link from "next/link";
import { useMindshareData } from "@/components/mindshare/useMindshareData";
import { StatusBar } from "@/components/mindshare/StatusBar";
import { StatCards } from "@/components/mindshare/StatCards";
import { Leaderboard } from "@/components/mindshare/Leaderboard";
import { MindshareBarChart } from "@/components/mindshare/MindshareBarChart";
import { TrendChart } from "@/components/mindshare/TrendChart";
import { TweetFeed } from "@/components/mindshare/TweetFeed";

export default function MindsharePage() {
  const { snapshot } = useMindshareData();

  return (
    <main className="relative min-h-screen px-4 py-12 md:px-8 overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-green-500/8 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <Link href="/" className="text-xs text-slate-600 hover:text-emerald-400 transition-colors w-fit">
            ← back
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="text-white">{snapshot?.chainName ?? "Robinhood Chain"}</span>{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Mindshare
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            Real-time share of voice across {snapshot?.kolCount ?? 0} tracked KOLs on X, sourced via Rettiwt.
          </p>
        </header>

        <StatusBar snapshot={snapshot} />
        <StatCards snapshot={snapshot} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MindshareBarChart snapshot={snapshot} />
          <TrendChart snapshot={snapshot} />
        </div>

        <Leaderboard snapshot={snapshot} />

        <TweetFeed />

        <footer className="text-xs text-slate-700 text-center mt-4 mb-8">
          Data refreshes automatically every few minutes. Configure tracked KOLs and keywords in{" "}
          <code className="text-slate-500">src/data/kols.json</code>.
        </footer>
      </div>
    </main>
  );
}
