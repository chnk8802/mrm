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
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js.js';

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('admin'), getUserStats);

router.route('/')
    .get(authorize('admin'), getUsers)
    .post(authorize('superadmin'), createUser);

router.route('/:id')
    .get(authorize('staff'), getUserById)
    .patch(authorize('admin'), updateUser)
    .delete(authorize('superadmin'), deleteUser);

router.patch("/:id/restore", restoreUser);

router.patch('/:id/deactivate', authorize('admin'), deactivateUser);
router.patch('/:id/activate', authorize('admin'), activateUser);

router.delete('/:id/permanent', authorize('superadmin'), deleteUserPermanently);

router.put('/:id/reset-password', authorize('admin'), resetPassword);

export default router;