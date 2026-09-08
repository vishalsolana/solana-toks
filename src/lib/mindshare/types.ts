export interface KolConfig {
  handle: string;
  name?: string;
}

export interface MindshareConfig {
  chainName: string;
  keywords: string[];
  kols: KolConfig[];
  windowDays: number;
  refreshIntervalMinutes: number;
  batchSize: number;
  maxPagesPerBatch: number;
  requestDelayMs: number;
}

export interface MatchedTweet {
  id: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  url: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount: number;
  matchedKeyword: string;
  fetchedAt: string;
}

export interface KolMindshare {
  handle: string;
  name: string;
  avatar?: string;
  tweetCount: number;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount: number;
  score: number;
  mindsharePct: number;
  lastTweetAt: string | null;
}

export interface MindshareHistoryPoint {
  timestamp: string;
  totalScore: number;
  totalTweets: number;
  topHandle: string | null;
}

export type RefreshState = "idle" | "running" | "error";

export interface RefreshStatus {
  state: RefreshState;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastDurationMs: number | null;
  nextRunAt: string | null;
  progress: string | null;
}

export interface MindshareSnapshot {
  chainName: string;
  keywords: string[];
  kolCount: number;
  windowDays: number;
  updatedAt: string | null;
  totalTweets: number;
  totalScore: number;
  leaderboard: KolMindshare[];
  history: MindshareHistoryPoint[];
  status: RefreshStatus;
  configured: boolean;
}
