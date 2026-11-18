import express from 'express';
import { authLimiter, registerLimiter } from '../utils/common/rateLimiters.js';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  logoutUser
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { updatePassword } from '../controllers/user.controller.js';
import authorize from '../middleware/rbac.middleware.js';

const router = express.Router();

router.route('/register').post(protect, authorize('superadmin'), registerLimiter, registerUser);
router.route('/login').post(authLimiter, loginUser);
router.route('/logout').post(logoutUser);
router.route('/profile').get(protect, getProfile).patch(protect, updateProfile);
router.patch('/profile/password', protect, updatePassword);

export default router;
