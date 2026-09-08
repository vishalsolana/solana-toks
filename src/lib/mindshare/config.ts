import kolsData from "@/data/kols.json";
import type { MindshareConfig } from "./types";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envList(name: string): string[] | null {
  const raw = process.env[name];
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : null;
}

let cached: MindshareConfig | null = null;

/** Loads dashboard config from src/data/kols.json, with optional env overrides. */
export function loadConfig(): MindshareConfig {
  if (cached) return cached;

  const keywords = envList("MINDSHARE_KEYWORDS") ?? kolsData.chain.keywords;
  const kols = kolsData.kols.map((k) => ({ handle: k.handle.replace(/^@/, ""), name: k.name }));

  cached = {
    chainName: process.env.MINDSHARE_CHAIN_NAME ?? kolsData.chain.name,
    keywords,
    kols,
    windowDays: envInt("MINDSHARE_WINDOW_DAYS", 7),
    refreshIntervalMinutes: envInt("MINDSHARE_REFRESH_MINUTES", 5),
    batchSize: envInt("MINDSHARE_BATCH_SIZE", 15),
    maxPagesPerBatch: envInt("MINDSHARE_MAX_PAGES", 3),
    requestDelayMs: envInt("MINDSHARE_REQUEST_DELAY_MS", 1500),
  };

  return cached;
}

/** Clears the cached config. Exposed for tests / hot-reload of kols.json. */
export function resetConfigCache(): void {
  cached = null;
}
