import express from 'express';
import {
    createRepair,
    getRepairs,
    getRepairById,
    updateRepair,
    deleteRepair,
    assignTechnician,
    updateRepairStatus,
    pickupRepair,
    restoreRepair,
    getRepairStats
} from '../controllers/repair.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js.js';

const router = express.Router();

router.use(protect);

// Stats — must be before /:id
router.get('/stats', authorize('admin'), getRepairStats);

// CRUD
router.route('/')
    .get(authorize('staff'), getRepairs)
    .post(authorize('manager'), createRepair);

router.route('/:id')
    .get(authorize('staff'), getRepairById)
    .patch(authorize('manager'), updateRepair)
    .delete(authorize('superadmin'), deleteRepair);

// Actions
router.patch('/:id/assign',   authorize('manager'),  assignTechnician);
router.patch('/:id/status',   authorize('staff'),  updateRepairStatus);
router.patch('/:id/pickup',   authorize('staff'),  pickupRepair);
router.patch('/:id/restore',  authorize('admin'),  restoreRepair);

export default router;