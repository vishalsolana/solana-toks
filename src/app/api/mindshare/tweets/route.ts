import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/mindshare/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;
  const handle = searchParams.get("handle") ?? undefined;

  const tweets = await store.getRecentTweets(limit, handle);
  return NextResponse.json({ tweets });
}
