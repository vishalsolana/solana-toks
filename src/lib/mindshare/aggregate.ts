import type { Tweet } from "rettiwt-api";
import type { KolConfig, KolMindshare, MatchedTweet } from "./types";

export function toMatchedTweet(tweet: Tweet, matchedKeyword: string): MatchedTweet {
  return {
    id: tweet.id,
    authorHandle: tweet.tweetBy.userName,
    authorName: tweet.tweetBy.fullName,
    authorAvatar: tweet.tweetBy.profileImage,
    text: tweet.fullText,
    url: tweet.url,
    createdAt: tweet.createdAt,
    likeCount: tweet.likeCount ?? 0,
    retweetCount: tweet.retweetCount ?? 0,
    replyCount: tweet.replyCount ?? 0,
    quoteCount: tweet.quoteCount ?? 0,
    viewCount: tweet.viewCount ?? 0,
    matchedKeyword,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Engagement-weighted "mindshare" score for a single tweet: a base weight for
 * showing up at all, plus a share-of-voice bonus scaled by how far the tweet
 * traveled. Views are log-scaled since raw view counts are 100-1000x other
 * metrics and would otherwise drown out likes/retweets/replies entirely.
 */
export function scoreTweet(t: Pick<MatchedTweet, "likeCount" | "retweetCount" | "replyCount" | "quoteCount" | "viewCount">): number {
  const engagement =
    t.likeCount * 1 + t.retweetCount * 4 + t.quoteCount * 3 + t.replyCount * 2 + Math.log10(t.viewCount + 1) * 5;
  return 1 + engagement;
}

export function buildLeaderboard(
  tweets: MatchedTweet[],
  kols: KolConfig[]
): { leaderboard: KolMindshare[]; totalScore: number; totalTweets: number } {
  const byHandle = new Map<string, KolMindshare>();

  const configByHandle = new Map(kols.map((k) => [k.handle.toLowerCase(), k]));

  for (const tweet of tweets) {
    const key = tweet.authorHandle.toLowerCase();
    // Only count tweets from KOLs still in the tracked list.
    if (!configByHandle.has(key)) continue;

    const existing = byHandle.get(key);
    const score = scoreTweet(tweet);
    const cfgName = configByHandle.get(key)?.name;

    if (existing) {
      existing.tweetCount += 1;
      existing.likeCount += tweet.likeCount;
      existing.retweetCount += tweet.retweetCount;
      existing.replyCount += tweet.replyCount;
      existing.quoteCount += tweet.quoteCount;
      existing.viewCount += tweet.viewCount;
      existing.score += score;
      if (!existing.lastTweetAt || tweet.createdAt > existing.lastTweetAt) {
        existing.lastTweetAt = tweet.createdAt;
      }
      if (tweet.authorAvatar) existing.avatar = tweet.authorAvatar;
    } else {
      byHandle.set(key, {
        handle: tweet.authorHandle,
        name: cfgName ?? tweet.authorName,
        avatar: tweet.authorAvatar,
        tweetCount: 1,
        likeCount: tweet.likeCount,
        retweetCount: tweet.retweetCount,
        replyCount: tweet.replyCount,
        quoteCount: tweet.quoteCount,
        viewCount: tweet.viewCount,
        score,
        mindsharePct: 0,
        lastTweetAt: tweet.createdAt,
      });
    }
  }

  // Include tracked KOLs with zero matching tweets so the leaderboard reflects the full roster.
  for (const kol of kols) {
    const key = kol.handle.toLowerCase();
    if (!byHandle.has(key)) {
      byHandle.set(key, {
        handle: kol.handle,
        name: kol.name ?? kol.handle,
        tweetCount: 0,
        likeCount: 0,
        retweetCount: 0,
        replyCount: 0,
        quoteCount: 0,
        viewCount: 0,
        score: 0,
        mindsharePct: 0,
        lastTweetAt: null,
      });
    }
  }

  const list = Array.from(byHandle.values());
  const totalScore = list.reduce((sum, k) => sum + k.score, 0);
  const totalTweets = list.reduce((sum, k) => sum + k.tweetCount, 0);

  for (const k of list) {
    k.mindsharePct = totalScore > 0 ? (k.score / totalScore) * 100 : 0;
  }

  list.sort((a, b) => b.score - a.score);

  return { leaderboard: list, totalScore, totalTweets };
}
