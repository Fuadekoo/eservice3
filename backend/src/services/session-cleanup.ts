import { deleteExpiredSessions } from "../lib/auth-session.js";

/**
 * Periodically clears out sessions that have expired.
 *
 * Expiry is enforced on every authenticated request, so this is not what makes
 * an expired session unusable. It exists so the table does not grow without
 * bound, and so Settings → Security lists only sessions that would actually
 * still work — a list full of dead devices teaches people to ignore it, which
 * is exactly the opposite of what that screen is for.
 */
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

let timer: NodeJS.Timeout | null = null;

async function sweep(): Promise<void> {
  try {
    const removed = await deleteExpiredSessions();
    if (removed > 0) {
      console.log(`[sessions] Cleared ${removed} expired session(s).`);
    }
  } catch (error) {
    // A failed sweep is not worth taking the process down for; the next one
    // will pick up whatever this one missed.
    console.error("[sessions] Cleanup sweep failed:", error);
  }
}

export function startSessionCleanupScheduler(): void {
  if (timer) return;

  // `unref` so a pending sweep never holds the process open during shutdown.
  timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
  timer.unref?.();

  void sweep();
}

export function stopSessionCleanupScheduler(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
