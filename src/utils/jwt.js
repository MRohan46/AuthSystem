// Helper functions for creating and verifying JSON Web Tokens (JWTs)
//
// HOW JWTs WORK (simplified):
//   A JWT is a string with 3 parts: header.payload.signature
//   - Header: algorithm info
//   - Payload: data (like userId, role) — NOT secret, anyone can decode it
//   - Signature: a hash that proves the token wasn't tampered with
//   The server verifies the signature using a secret key only IT knows.

import jwt from 'jsonwebtoken';

// ─── Generate a short-lived access token ─────────────────────────────────
// Access tokens are sent with every request to prove identity.
// They expire quickly (e.g., 15 min) to limit damage if stolen.
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

// ─── Generate a long-lived refresh token ─────────────────────────────────
// Refresh tokens are used to get new access tokens without re-logging in.
// They live longer (e.g., 7 days) but are stored securely in the DB.
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

// ─── Verify an access token ───────────────────────────────────────────────
// Returns the decoded payload, or throws if the token is invalid/expired.
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

// ─── Verify a refresh token ───────────────────────────────────────────────
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// ─── Attach tokens to the HTTP response ──────────────────────────────────
// Access token → sent in JSON body (client stores in memory)
// Refresh token → sent as HttpOnly cookie (JS can't read it — safer!)
export const sendTokens = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // HttpOnly + Secure cookies protect refresh tokens from XSS attacks
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,               // JS cannot access this cookie
    secure: isProduction,         // Only sent over HTTPS in production
    sameSite: 'strict',           // Helps prevent CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return { accessToken };
};