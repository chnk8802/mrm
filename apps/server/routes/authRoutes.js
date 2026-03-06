import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  logoutUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

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
  .put(protect, updateProfile);

export default router;
