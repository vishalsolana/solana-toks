import { NextResponse } from "next/server";
import { store } from "@/lib/mindshare/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await store.getSnapshot();
  return NextResponse.json(snapshot);
}
