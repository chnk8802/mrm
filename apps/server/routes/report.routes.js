import express from 'express';
import {
    getOwedReport,
    getCollectedReport
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/owed', authorize('manager'), getOwedReport);
router.get('/collected', authorize('manager'), getCollectedReport);

export default router;