// All routes related to authentication

import { Router } from 'express';
import { register, login, refresh, logout, logoutAll } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerRules, loginRules, validate } from '../middleware/validate.js';

const router = Router();

// Public routes — no login required
router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login',    authLimiter, loginRules,    validate, login);
router.post('/refresh',  refresh);

// Protected routes — must be logged in
router.post('/logout',     protect, logout);
router.post('/logout-all', protect, logoutAll);

export default router;