import express from 'express';
import httpStatus from 'http-status';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { authMiddleware, requireRoles } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// Basic analytics
router.get('/admin/analytics', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const [users, posts] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
    ]);
    return sendSuccess(res, { data: { users, posts } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load analytics' });
  }
});

// List users
router.get('/admin/users', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('username email role isBlocked createdAt').lean();
    return sendSuccess(res, { data: { users } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load users' });
  }
});

// Block/Unblock
router.patch('/admin/users/:id/block', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const { blocked } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: !!blocked }, { new: true });
    if (!user) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });
    return sendSuccess(res, { data: { user: { _id: user._id, isBlocked: user.isBlocked } } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update user' });
  }
});

export default router;
