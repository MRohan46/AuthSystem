// Routes for user profile and admin operations

import { Router } from 'express';
import { getMe, updateMe, getAllUsers, deactivateUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// Any logged-in user
router.get('/me',   getMe);
router.patch('/me', updateMe);

// Admin-only routes
router.get('/',                      authorize('admin'), getAllUsers);
router.patch('/:id/deactivate',      authorize('admin'), deactivateUser);

export default router;