import express from 'express';
import { createOrganization } from '../controllers/organization.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);
router.post('/', authorize('superadmin'), createOrganization);

export default router;