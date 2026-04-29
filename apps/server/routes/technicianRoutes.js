import express from 'express';
import { getTechnicians } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('manager'), getTechnicians);

export default router;