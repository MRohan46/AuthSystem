// Handles all authentication logic: register, login, refresh, logout

import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sendTokens,
} from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import bcrypt from 'bcryptjs';

// ─── REGISTER ─────────────────────────────────────────────────────────────
// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, 'Email is already registered.');
    }

    // Create user — password is hashed automatically by the User model's pre-save hook
    const user = await User.create({ name, email, password });

    // Build token payload — keep it minimal, never put passwords here!
    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save a hash of the refresh token in DB so we can invalidate it later
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens = [hashedRefresh];
    await user.save();

    // Send access token in body, refresh token as HttpOnly cookie
    const tokens = sendTokens(res, accessToken, refreshToken);

    return successResponse(res, 201, 'Account created successfully!', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────
// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password (excluded by default in schema) and refresh tokens
    const user = await User.findOne({ email }).select('+password +refreshTokens');

    // Generic message — don't reveal whether email or password was wrong
    const invalidMsg = 'Invalid email or password.';

    if (!user) return errorResponse(res, 401, invalidMsg);

    // Check if account is temporarily locked due to too many failed attempts
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return errorResponse(
        res,
        423,
        `Account temporarily locked. Try again in ${minutesLeft} minute(s).`
      );
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.handleFailedLogin(); // Increment lockout counter
      return errorResponse(res, 401, invalidMsg);
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been deactivated.');
    }

    // Successful login — reset any lockout state
    await user.resetLoginAttempts();

    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store hashed refresh token (keep max 5 active sessions)
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), hashedRefresh];
    await user.save();

    const tokens = sendTokens(res, accessToken, refreshToken);

    return successResponse(res, 200, 'Logged in successfully.', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Issues a new access token using the refresh token stored in the cookie
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return errorResponse(res, 401, 'No refresh token provided.');
    }

    // Verify the refresh token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return errorResponse(res, 401, 'Invalid or expired refresh token.');
    }

    // Find the user and their stored tokens
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) return errorResponse(res, 401, 'User not found.');

    // Check if this refresh token is in the user's list (rotation check)
    const tokenMatch = await Promise.any(
      (user.refreshTokens || []).map((hashed) => bcrypt.compare(token, hashed))
    ).catch(() => false);

    if (!tokenMatch) {
      // Token reuse detected — could be a stolen token! Revoke ALL sessions.
      user.refreshTokens = [];
      await user.save();
      return errorResponse(res, 401, 'Token reuse detected. Please log in again.');
    }

    // Issue new tokens (token rotation — old refresh token is replaced)
    const payload = { id: user._id, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Replace old token with new one in DB
    const hashedNew = await bcrypt.hash(newRefreshToken, 10);
    user.refreshTokens = (user.refreshTokens || [])
      .filter(async (h) => !(await bcrypt.compare(token, h)))
      .concat(hashedNew);
    user.refreshTokens = [hashedNew]; // Simplified: single active session
    await user.save();

    const tokens = sendTokens(res, newAccessToken, newRefreshToken);

    return successResponse(res, 200, 'Token refreshed.', tokens);
  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────
// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Remove this refresh token from the DB to invalidate the session
      const user = await User.findById(req.user.id).select('+refreshTokens');
      if (user) {
        // Keep tokens that DON'T match this one (remove only current session)
        const remaining = [];
        for (const hashed of user.refreshTokens || []) {
          const matches = await bcrypt.compare(token, hashed);
          if (!matches) remaining.push(hashed);
        }
        user.refreshTokens = remaining;
        await user.save();
      }
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

    return successResponse(res, 200, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ALL SESSIONS ──────────────────────────────────────────────────
// POST /api/auth/logout-all
// Useful if user suspects their account was compromised
export const logoutAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+refreshTokens');
    user.refreshTokens = []; // Wipe ALL refresh tokens → all devices logged out
    await user.save();

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

    return successResponse(res, 200, 'Logged out from all devices.');
  } catch (error) {
    next(error);
  }
};