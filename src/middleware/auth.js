// Middleware to protect routes — only authenticated users can access them

import { verifyAccessToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import User from '../models/User.js';

// ─── protect: Verify the JWT access token ────────────────────────────────
// Attach this middleware to any route that requires login.
// Usage: router.get('/profile', protect, getProfile)
export const protect = async (req, res, next) => {
  try {
    // Tokens are sent in the Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1]; // Extract the token part

    // Verify signature and expiry — throws if invalid
    const decoded = verifyAccessToken(token);

    // Fetch the user from DB to confirm they still exist and are active
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return errorResponse(res, 401, 'User no longer exists or is inactive.');
    }

    req.user = user; // Attach user to request so routes can use it
    next();
  } catch (error) {
    // jwt.verify throws TokenExpiredError or JsonWebTokenError
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Session expired. Please log in again.');
    }
    return errorResponse(res, 401, 'Invalid token. Please log in again.');
  }
};

// ─── authorize: Restrict access to specific roles ─────────────────────────
// Usage: router.delete('/user/:id', protect, authorize('admin'), deleteUser)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Role '${req.user.role}' is not authorized.`
      );
    }
    next();
  };
};