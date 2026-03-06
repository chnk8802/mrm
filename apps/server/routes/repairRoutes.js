import express from 'express';
import {
    createRepair,
    getRepairs,
    getRepairById,
    updateRepair,
    deleteRepair,
    assignTechnician,
    completeRepair,
    getRepairStats
} from '../controllers/repairController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// CRUD routes
router.route('/')
    .get(getRepairs)
    .post(createRepair);

router.route('/stats')
    .get(getRepairStats);

router.route('/:id')
    .get(getRepairById)
    .put(updateRepair)
    .delete(deleteRepair);

// Action routes
router.route('/:id/assign')
    .put(assignTechnician);

router.route('/:id/complete')
    .put(completeRepair);

export default router;