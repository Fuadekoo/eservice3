import rateLimit from "express-rate-limit";

// Shared helpers
const FIFTEEN_MIN = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function msg(action: string) {
  return {
    error: "RateLimitExceeded",
    message: `Too many ${action}. Please wait and try again.`,
    retryAfter: "Check the Retry-After header for the wait time.",
  };
}

/**
 * Global limiter — applied to every /back-api route.
 * Covers bots and scrapers that target any endpoint.
 */
export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("requests from this IP"),
});

/**
 * Login — protects against brute-force credential attacks.
 * 10 attempts per 15 minutes.
 */
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("sign-in attempts"),
});

/**
 * Customer registration — prevents bulk account creation.
 * 5 registrations per hour.
 */
export const registrationLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("registration attempts"),
});

/**
 * Forgot-password OTP request — prevents SMS/OTP abuse.
 * 5 requests per hour.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("password-reset requests"),
});

/**
 * OTP verification — limits guessing attempts per session.
 * 10 attempts per 15 minutes.
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("verification attempts"),
});

/**
 * Password reset (final step) — prevents token enumeration.
 * 5 attempts per 15 minutes.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("password-reset submissions"),
});

/**
 * Change password (authenticated) — limits abuse on the /change-password endpoint.
 * 10 attempts per 15 minutes.
 */
export const changePasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("password-change attempts"),
});

/**
 * File uploads — prevents storage abuse.
 * 30 uploads per hour.
 */
export const uploadLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("upload requests"),
});

/**
 * Write operations — applied to POST/PUT/PATCH on data resources
 * such as feedback, requests, and appointments.
 * 60 writes per 15 minutes.
 */
export const writeLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("write requests"),
});
