// Handles user profile and admin operations

import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';

// ─── GET CURRENT USER PROFILE ─────────────────────────────────────────────
// GET /api/users/me
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the 'protect' middleware
    const user = await User.findById(req.user.id);
    return successResponse(res, 200, 'Profile fetched.', { user });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE CURRENT USER PROFILE ─────────────────────────────────────────
// PATCH /api/users/me
export const updateMe = async (req, res, next) => {
  try {
    // Only allow safe fields to be updated — never role or password here
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true } // Return updated doc + run schema rules
    );

    return successResponse(res, 200, 'Profile updated.', { user });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: GET ALL USERS ─────────────────────────────────────────────────
// GET /api/users  (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-__v');
    return successResponse(res, 200, `${users.length} users found.`, { users });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: DEACTIVATE A USER ─────────────────────────────────────────────
// PATCH /api/users/:id/deactivate  (admin only)
export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) return errorResponse(res, 404, 'User not found.');

    return successResponse(res, 200, 'User deactivated.', { user });
  } catch (error) {
    next(error);
  }
};