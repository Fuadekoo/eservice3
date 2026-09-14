/**
 * How long a signed-in session stays valid, and where those numbers come from.
 *
 * Session lifetime used to be unstated: `JWT_EXPIRES_IN` was absent from the
 * environment, so tokens silently fell back to seven days, and the `session`
 * rows behind them had no expiry at all — a row created once was accepted for
 * ever. Signing out on one device revoked that device; walking away from one
 * revoked nothing.
 *
 * Two limits are enforced, which is the usual pair for an authenticated desk
 * application:
 *
 *   - An *absolute* lifetime, counted from sign-in. Re-authentication is
 *     required once it passes, however active the person has been.
 *   - An *idle* lifetime, counted from the last request the session made. An
 *     unattended browser stops being a way in.
 *
 * Both are configurable, both have safe defaults, and the JWT's own expiry is
 * derived from the absolute lifetime so the token and the row behind it can
 * never disagree about when the session ended.
 */

/** The default secret shipped in source. Never acceptable in production. */
const INSECURE_DEFAULT_SECRET = "your-secret-key-change-in-production";

/**
 * Parse a duration written the way a person would write one.
 *
 * Accepts `30s`, `15m`, `12h`, `7d`, or a bare number of seconds. Returns null
 * for anything else so the caller can fall back and say so, rather than
 * treating a typo as zero and expiring every session immediately.
 */
export function parseDuration(value: string | undefined): number | null {
  if (!value) return null;

  const trimmed = value.trim().toLowerCase();
  const match = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/.exec(trimmed);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = match[2] ?? "s";
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] as number);
}

function readDuration(
  variableName: string,
  fallback: string,
): { ms: number; source: string } {
  const raw = process.env[variableName];
  const parsed = parseDuration(raw);

  if (raw && parsed === null) {
    console.warn(
      `[session] ${variableName}="${raw}" is not a duration ` +
        `(expected e.g. "30m", "12h", "7d"). Falling back to ${fallback}.`,
    );
  }

  const value = parsed ?? (parseDuration(fallback) as number);
  return { ms: value, source: parsed !== null ? (raw as string) : fallback };
}

const absolute = readDuration("SESSION_ABSOLUTE_TIMEOUT", "12h");
const idle = readDuration("SESSION_IDLE_TIMEOUT", "30m");

/**
 * The hard limit on a session, counted from sign-in.
 */
export const SESSION_ABSOLUTE_TIMEOUT_MS = absolute.ms;

/**
 * How long a session may sit untouched before it is treated as abandoned.
 *
 * Clamped to the absolute lifetime: an idle window longer than the session
 * itself can never trigger, and configuring one is always a mistake.
 */
export const SESSION_IDLE_TIMEOUT_MS = Math.min(idle.ms, absolute.ms);

/**
 * What `jwt.sign` is given for `expiresIn`.
 *
 * Expressed in seconds and derived from the absolute lifetime rather than read
 * from its own variable, so a token can never outlive — or die before — the
 * session row it points at.
 */
export const JWT_EXPIRES_IN_SECONDS = Math.floor(
  SESSION_ABSOLUTE_TIMEOUT_MS / 1000,
);

export const JWT_SECRET = process.env.JWT_SECRET || INSECURE_DEFAULT_SECRET;

/** When a session created now should stop being accepted. */
export function sessionExpiryFrom(startedAt: Date = new Date()): Date {
  return new Date(startedAt.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS);
}

/**
 * Why this session is no longer valid, or null when it still is.
 *
 * Kept as a pure function of the two timestamps so the middleware, the cleanup
 * sweep and any future job all apply exactly the same rule.
 */
export function sessionExpiryReason(
  session: { expiresAt: Date | null; lastSeenAt: Date },
  now: Date = new Date(),
): "absolute" | "idle" | null {
  if (session.expiresAt && session.expiresAt.getTime() <= now.getTime()) {
    return "absolute";
  }

  if (now.getTime() - session.lastSeenAt.getTime() > SESSION_IDLE_TIMEOUT_MS) {
    return "idle";
  }

  return null;
}

/**
 * Check the session configuration at boot and complain loudly about anything
 * unsafe.
 *
 * A missing `JWT_SECRET` is fatal in production: every token the process signs
 * would be forgeable by anyone who has read this repository. In development it
 * is a warning, so a fresh checkout still runs.
 */
export function assertSessionConfig(): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (JWT_SECRET === INSECURE_DEFAULT_SECRET) {
    const message =
      "JWT_SECRET is not set, so tokens are being signed with the placeholder " +
      "secret committed to this repository. Anyone can forge a session.";

    if (isProduction) {
      throw new Error(`[session] ${message} Refusing to start.`);
    }
    console.warn(`[session] ⚠️  ${message} Set JWT_SECRET before deploying.`);
  } else if (JWT_SECRET.length < 32) {
    console.warn(
      "[session] ⚠️  JWT_SECRET is shorter than 32 characters. Use a long " +
        "random value — `openssl rand -base64 48` produces a suitable one.",
    );
  }

  console.log(
    `[session] Sessions expire ${absolute.source} after sign-in, or after ` +
      `${idle.source} of inactivity.`,
  );
}
