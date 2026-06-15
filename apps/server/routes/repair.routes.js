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
    getRepairStats
} from '../controllers/repair.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js.js';

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('manager'), getRepairStats);

router.route('/')
    .get(authorize('staff'), getRepairs)
    .post(authorize('manager'), createRepair);

router.route('/:id')
    .get(authorize('staff'), getRepairById)
    .patch(authorize('manager'), updateRepair)
    .delete(authorize('superadmin'), deleteRepair);

router.patch('/:id/assign',   authorize('manager'),  assignTechnician);
router.patch('/:id/status',   authorize('staff'),  updateRepairStatus);
router.patch('/:id/pickup',   authorize('staff'),  pickupRepair);

export default router;