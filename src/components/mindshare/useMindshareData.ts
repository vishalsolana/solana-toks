"use client";

import { useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import type { MindshareSnapshot } from "@/lib/mindshare/types";

const SNAPSHOT_KEY = "/api/mindshare";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Polls the mindshare snapshot on an interval and also subscribes to the SSE
 * stream so a completed refresh cycle updates the UI immediately rather than
 * waiting for the next poll.
 */
export function useMindshareData() {
  const { data, error, isLoading } = useSWR<MindshareSnapshot>(SNAPSHOT_KEY, fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    let source: EventSource | null = null;
    try {
      source = new EventSource("/api/mindshare/stream");
      source.onmessage = (event) => {
        try {
          const snapshot: MindshareSnapshot = JSON.parse(event.data);
          void globalMutate(SNAPSHOT_KEY, snapshot, false);
        } catch {
          // ignore malformed frame
        }
      };
      source.onerror = () => {
        // SWR's polling interval covers us if the stream drops.
      };
    } catch {
      // EventSource unsupported — polling alone still works.
    }

    return () => source?.close();
  }, []);

  return { snapshot: data, error, isLoading };
}

export async function triggerRefresh(): Promise<void> {
  await fetch("/api/mindshare/refresh", { method: "POST" });
  await globalMutate(SNAPSHOT_KEY);
}
