import express from 'express';
import {createOrganization, getOrganizations} from '../../controllers/organization.controller.js'
import { protect } from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);
router.post('/', authorize('superadmin'), createOrganization);
router.get('/', authorize('superadmin'), getOrganizations);

export default router;