// Rate limiting prevents brute-force attacks by capping requests per IP
// Example: an attacker can't try 10,000 passwords — they'll be blocked

import rateLimit from 'express-rate-limit';

// ─── General API rate limiter ─────────────────────────────────────────────
// Applies to all routes — prevents API abuse
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 100,                  // Max 100 requests per IP per window
  standardHeaders: true,     // Send rate limit info in response headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again in 15 minutes.',
  },
});

// ─── Strict limiter for auth routes ──────────────────────────────────────
// Login and register are the most sensitive — limit them more aggressively
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10,                   // Only 10 attempts per IP per window
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
  message: {
    success: false,
    message: 'Too many auth attempts. Please wait 15 minutes and try again.',
  },
});