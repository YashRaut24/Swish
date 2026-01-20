import express from 'express';
import httpStatus from 'http-status';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Report from '../models/Report.js';
import { authMiddleware, requireRoles } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

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

router.get('/admin/users', authMiddleware, requireRoles('Admin'), async (request, response) => {
  try {
    const users = await User.find().select('username email role isBlocked createdAt').lean();
    return sendSuccess(response, { data: { users } });
  } catch (err) {
    return sendError(response, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load users' });
  }
});

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


router.get('/admin/posts', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, { data: { posts } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load posts' });
  }
});


router.patch('/admin/posts/:id/hide', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const { hidden } = req.body;
    const post = await Post.findByIdAndUpdate(req.params.id, { isHidden: !!hidden }, { new: true });
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    return sendSuccess(res, { data: { post: { _id: post._id, isHidden: post.isHidden } } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update post' });
  }
});


router.get('/admin/reports', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'username')
      .populate('targetId', 'username caption')
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, { data: { reports } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load reports' });
  }
});


router.patch('/admin/reports/:id/resolve', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const { resolution } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolution,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      },
      { new: true }
    );
    if (!report) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Report not found' });

    
    if (resolution === 'removed' && report.targetType === 'Post') {
      await Post.findByIdAndUpdate(report.targetId, { isHidden: true });
    }

    return sendSuccess(res, { data: { report } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to resolve report' });
  }
});


router.get('/admin/users/activity', authMiddleware, requireRoles('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('username email role isBlocked createdAt').lean();
    const usersWithPostCount = await Promise.all(
      users.map(async (user) => {
        const postCount = await Post.countDocuments({ author: user._id });
        return { ...user, postCount };
      })
    );
    return sendSuccess(res, { data: { users: usersWithPostCount } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load users' });
  }
});

export default router;
