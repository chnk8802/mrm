import express from 'express';
import { getMyOrganization } from '../controllers/organization.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/me', protect, getMyOrganization );

export default router;