export async function register() {
  // Only start the background X/Twitter poller in the actual Node.js server
  // process (not the edge runtime, and not during `next build`).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/mindshare/scheduler");
    startScheduler();
  }
}
