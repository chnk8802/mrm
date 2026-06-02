import express from 'express';
import {
    createSparePartUsage,
    bulkCreateSparePartUsage,
    getSparePartUsages,
    getSparePartUsageById,
    updateSparePartUsage,
    bulkUpdateSparePartUsage,
    deleteSparePartUsage,
} from '../controllers/sparePartUsage.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js.js';

const router = express.Router();

router.use(protect);

router.post('/bulk',  authorize('staff'),   bulkCreateSparePartUsage);
router.patch('/bulk', authorize('admin'), bulkUpdateSparePartUsage);

router.route('/')
    .get(authorize('staff'),   getSparePartUsages)
    .post(authorize('staff'),  createSparePartUsage);

router.route('/:id')
    .get(authorize('staff'),    getSparePartUsageById)
    .patch(authorize('manager'), updateSparePartUsage)
    .delete(authorize('manager'), deleteSparePartUsage);

export default router;