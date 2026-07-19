const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 4; // per IP per window

const hits = new Map(); // ip -> array of timestamps

export function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    hits.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return false;
}
