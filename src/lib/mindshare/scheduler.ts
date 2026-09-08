import { getRettiwtClient, isRettiwtConfigured } from "./client";
import { loadConfig } from "./config";
import { store } from "./store";
import { toMatchedTweet } from "./aggregate";
import type { MatchedTweet } from "./types";

// Re-fetch this far back past the last successful run so a slow cycle or a
// brief outage can't leave a gap between two windows. Duplicate tweets are
// harmless since the store dedupes by tweet id.
const OVERLAP_MS = 15 * 60 * 1000;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

export async function runRefreshCycle(): Promise<void> {
  if (running) {
    console.warn("[mindshare] refresh already in progress, skipping this trigger");
    return;
  }
  if (!isRettiwtConfigured()) {
    await store.setStatus({
      state: "error",
      lastError: "RETTIWT_API_KEY is not configured — see .env.local.example.",
    });
    return;
  }

  running = true;
  const startedAt = Date.now();
  await store.setStatus({ state: "running", lastRunAt: new Date(startedAt).toISOString(), progress: "starting" });

  try {
    const cfg = loadConfig();
    const rettiwt = getRettiwtClient();
    const priorStatus = await store.getStatus();

    const since = priorStatus.lastSuccessAt
      ? new Date(new Date(priorStatus.lastSuccessAt).getTime() - OVERLAP_MS)
      : new Date(Date.now() - cfg.windowDays * 24 * 60 * 60 * 1000);

    const handles = cfg.kols.map((k) => k.handle);
    const batches = chunk(handles, cfg.batchSize);
    const found: MatchedTweet[] = [];

    let batchIndex = 0;
    for (const keyword of cfg.keywords) {
      for (const batch of batches) {
        batchIndex++;
        await store.setStatus({
          progress: `keyword "${keyword}" — batch ${batchIndex}/${batches.length * cfg.keywords.length}`,
        });

        let cursor: string | undefined;
        for (let page = 0; page < cfg.maxPagesPerBatch; page++) {
          try {
            const res = await rettiwt.tweet.search(
              { fromUsers: batch, includePhrase: keyword, startDate: since },
              100,
              cursor
            );

            for (const tweet of res.list) {
              found.push(toMatchedTweet(tweet, keyword));
            }

            if (!res.next || res.list.length === 0) break;
            cursor = res.next;
          } catch (err) {
            console.warn(
              `[mindshare] search failed for keyword "${keyword}" batch [${batch.join(",")}]:`,
              err instanceof Error ? err.message : err
            );
            break;
          }

          await sleep(cfg.requestDelayMs);
        }

        await sleep(cfg.requestDelayMs);
      }
    }

    const added = await store.addTweets(found);

    await store.setStatus({
      state: "idle",
      lastSuccessAt: new Date().toISOString(),
      lastError: null,
      lastDurationMs: Date.now() - startedAt,
      nextRunAt: new Date(Date.now() + cfg.refreshIntervalMinutes * 60_000).toISOString(),
      progress: null,
    });

    console.log(
      `[mindshare] refresh complete: ${found.length} matches (${added} new) in ${Date.now() - startedAt}ms`
    );
  } catch (err) {
    console.error("[mindshare] refresh cycle failed:", err);
    await store.setStatus({
      state: "error",
      lastError: err instanceof Error ? err.message : String(err),
      lastDurationMs: Date.now() - startedAt,
      progress: null,
    });
  } finally {
    running = false;
  }
}

/** Starts the recurring background refresh loop. Safe to call multiple times — only arms one interval. */
export function startScheduler(): void {
  const globalFlag = globalThis as unknown as { __mindshareSchedulerStarted?: boolean };
  if (globalFlag.__mindshareSchedulerStarted) return;
  globalFlag.__mindshareSchedulerStarted = true;

  const cfg = loadConfig();
  console.log(
    `[mindshare] scheduler starting — refreshing every ${cfg.refreshIntervalMinutes}m for ${cfg.kols.length} KOLs`
  );

  timer = setInterval(() => void runRefreshCycle(), cfg.refreshIntervalMinutes * 60_000);
  timer.unref?.();

  // Kick off an initial run shortly after boot rather than immediately, so it
  // doesn't compete with the rest of the server's startup work.
  setTimeout(() => void runRefreshCycle(), 5000);
}

export function isSchedulerRunning(): boolean {
  return running;
}
