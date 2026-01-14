import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/response.js';

const router = express.Router();

// Stub share endpoint
router.post('/shares', authMiddleware, (req, res) => {
  return sendSuccess(res, { data: { shared: true } });
});

export default router;
