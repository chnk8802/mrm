import express from 'express';
import { getTechnicians } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('manager'), getTechnicians);

export default router;