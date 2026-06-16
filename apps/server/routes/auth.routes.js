import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  logoutUser
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { updatePassword } from '../controllers/user.controller.js';

const router = express.Router();

// Public routes
router.route('/register')
  .post(registerUser);

router.route('/login')
  .post(loginUser);

router.route('/logout')
  .post(logoutUser);

// Private routes
router.route('/profile')
  .get(protect, getProfile)
  .patch(protect, updateProfile);

router.patch('/profile/password', protect, updatePassword);

export default router;
