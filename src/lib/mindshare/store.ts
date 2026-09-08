import { EventEmitter } from "events";
import { promises as fs } from "fs";
import path from "path";

import { buildLeaderboard } from "./aggregate";
import { loadConfig } from "./config";
import { isRettiwtConfigured } from "./client";
import type { MatchedTweet, MindshareHistoryPoint, MindshareSnapshot, RefreshStatus } from "./types";

const DATA_DIR = process.env.MINDSHARE_DATA_DIR ?? path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "mindshare-store.json");

const MAX_HISTORY_POINTS = 500;
const MAX_TWEETS_STORED = 5000;

interface PersistedState {
  tweets: MatchedTweet[];
  history: MindshareHistoryPoint[];
  status: RefreshStatus;
}

function emptyStatus(): RefreshStatus {
  return {
    state: "idle",
    lastRunAt: null,
    lastSuccessAt: null,
    lastError: null,
    lastDurationMs: null,
    nextRunAt: null,
    progress: null,
  };
}

class MindshareStore extends EventEmitter {
  private tweetsById = new Map<string, MatchedTweet>();
  private history: MindshareHistoryPoint[] = [];
  private status: RefreshStatus = emptyStatus();
  private loaded = false;
  private loadPromise: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        try {
          const raw = await fs.readFile(DATA_FILE, "utf-8");
          const parsed: PersistedState = JSON.parse(raw);
          for (const t of parsed.tweets ?? []) this.tweetsById.set(t.id, t);
          this.history = parsed.history ?? [];
          this.status = { ...emptyStatus(), ...parsed.status };
        } catch {
          // No existing store yet — start fresh.
        } finally {
          this.loaded = true;
        }
      })();
    }
    return this.loadPromise;
  }

  private persist(): void {
    const snapshot: PersistedState = {
      tweets: Array.from(this.tweetsById.values()),
      history: this.history,
      status: this.status,
    };
    this.writeQueue = this.writeQueue
      .then(async () => {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
        await fs.writeFile(tmpFile, JSON.stringify(snapshot));
        await fs.rename(tmpFile, DATA_FILE);
      })
      .catch((err) => {
        console.warn("[mindshare] failed to persist store:", err instanceof Error ? err.message : err);
      });
  }

  private pruneOldTweets(): void {
    const cfg = loadConfig();
    const cutoff = Date.now() - cfg.windowDays * 24 * 60 * 60 * 1000;
    for (const id of Array.from(this.tweetsById.keys())) {
      const tweet = this.tweetsById.get(id)!;
      if (new Date(tweet.createdAt).getTime() < cutoff) {
        this.tweetsById.delete(id);
      }
    }
    // Hard cap as a safety net regardless of window, oldest first.
    if (this.tweetsById.size > MAX_TWEETS_STORED) {
      const sorted = Array.from(this.tweetsById.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const excess = sorted.slice(0, sorted.length - MAX_TWEETS_STORED);
      for (const t of excess) this.tweetsById.delete(t.id);
    }
  }

  async getStatus(): Promise<RefreshStatus> {
    await this.ensureLoaded();
    return { ...this.status };
  }

  async setStatus(patch: Partial<RefreshStatus>): Promise<void> {
    await this.ensureLoaded();
    this.status = { ...this.status, ...patch };
    this.persist();
    this.emit("status", this.status);
  }

  /** Merges newly fetched tweets in, dedupes by id, prunes the window, and records a history point. */
  async addTweets(tweets: MatchedTweet[]): Promise<number> {
    await this.ensureLoaded();
    let added = 0;
    for (const t of tweets) {
      if (!this.tweetsById.has(t.id)) added++;
      this.tweetsById.set(t.id, t);
    }
    this.pruneOldTweets();

    const cfg = loadConfig();
    const { totalScore, totalTweets, leaderboard } = buildLeaderboard(Array.from(this.tweetsById.values()), cfg.kols);
    this.history.push({
      timestamp: new Date().toISOString(),
      totalScore,
      totalTweets,
      topHandle: leaderboard[0]?.tweetCount ? leaderboard[0].handle : null,
    });
    if (this.history.length > MAX_HISTORY_POINTS) {
      this.history = this.history.slice(this.history.length - MAX_HISTORY_POINTS);
    }

    this.persist();
    this.emit("update");
    return added;
  }

  async getSnapshot(): Promise<MindshareSnapshot> {
    await this.ensureLoaded();
    const cfg = loadConfig();
    const { leaderboard, totalScore, totalTweets } = buildLeaderboard(Array.from(this.tweetsById.values()), cfg.kols);

    return {
      chainName: cfg.chainName,
      keywords: cfg.keywords,
      kolCount: cfg.kols.length,
      windowDays: cfg.windowDays,
      updatedAt: this.status.lastSuccessAt,
      totalTweets,
      totalScore,
      leaderboard,
      history: this.history,
      status: { ...this.status },
      configured: isRettiwtConfigured(),
    };
  }

  async getRecentTweets(limit = 50, handle?: string): Promise<MatchedTweet[]> {
    await this.ensureLoaded();
    let list = Array.from(this.tweetsById.values());
    if (handle) {
      const target = handle.toLowerCase();
      list = list.filter((t) => t.authorHandle.toLowerCase() === target);
    }
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list.slice(0, limit);
  }

  /** Subscribes to store updates (new data or status change). Returns an unsubscribe function. */
  onChange(listener: () => void): () => void {
    const handler = () => listener();
    this.on("update", handler);
    this.on("status", handler);
    return () => {
      this.off("update", handler);
      this.off("status", handler);
    };
  }
}

// Survive Next.js dev-mode module reloads by stashing the singleton on globalThis.
const globalForStore = globalThis as unknown as { __mindshareStore?: MindshareStore };

export const store = globalForStore.__mindshareStore ?? new MindshareStore();
store.setMaxListeners(50);
globalForStore.__mindshareStore = store;
