import express from 'express';
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    deactivateUser,
    resetPassword,
    getUserStats,
    activateUser,
    deleteUserPermanently,
    restoreUser
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics route
router.get('/stats', authorize('admin'), getUserStats);

// CRUD routes
router.route('/')
    .get(authorize('admin'), getUsers)
    .post(authorize('superadmin'), createUser);

router.route('/:id')
    .get(authorize('staff'), getUserById)
    .put(authorize('admin'), updateUser)
    .delete(authorize('superadmin'), deleteUser);

router.patch("/:id/restore", restoreUser);

router.patch('/:id/deactivate', authorize('admin'), deactivateUser);
router.patch('/:id/activate', authorize('admin'), activateUser);

router.delete('/:id/permanent', authorize('superadmin'), deleteUserPermanently);

// Reset password route
router.put('/:id/reset-password', authorize('admin'), resetPassword);

export default router;