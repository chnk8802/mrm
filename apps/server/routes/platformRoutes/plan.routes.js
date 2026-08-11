import express from 'express';
import { getPlans } from '../../controllers/plan.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/', authorize('superadmin'), getPlans);

export default router;