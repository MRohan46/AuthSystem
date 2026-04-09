// Input validation rules using express-validator
// Validates user input BEFORE it reaches the controller or database

import { body, validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

// ─── Run validation and return errors if any ─────────────────────────────
// Always use this as the LAST middleware in a validation chain
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors as { field: 'email', message: 'Invalid email' }
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return errorResponse(res, 422, 'Validation failed', formatted);
  }

  next(); // Input is clean — proceed to the controller
};

// ─── Validation rules for user registration ───────────────────────────────
export const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be 50 characters or less'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(), // Lowercase, remove dots in Gmail, etc.

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

// ─── Validation rules for login ───────────────────────────────────────────
export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];