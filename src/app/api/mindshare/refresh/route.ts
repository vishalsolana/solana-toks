import { NextRequest, NextResponse } from "next/server";
import { isSchedulerRunning, runRefreshCycle } from "@/lib/mindshare/scheduler";
import { store } from "@/lib/mindshare/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.MINDSHARE_REFRESH_SECRET;
  if (!secret) return true; // no secret configured — allow (e.g. local dev)
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Triggers a refresh cycle. Meant to be called either manually from the
 * dashboard, or on a schedule by an external cron (e.g. Vercel Cron, GitHub
 * Actions) when the app runs on a serverless platform where the in-process
 * setInterval scheduler doesn't persist between invocations.
 */
async function handleTrigger(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isSchedulerRunning()) {
    const status = await store.getStatus();
    return NextResponse.json({ triggered: false, reason: "already running", status });
  }

  // Run to completion and report the result — cron callers want to know
  // whether the fetch actually succeeded, not just that it started.
  await runRefreshCycle();
  const status = await store.getStatus();
  return NextResponse.json({ triggered: true, status });
}

export async function POST(req: NextRequest) {
  return handleTrigger(req);
}

export async function GET(req: NextRequest) {
  return handleTrigger(req);
}
