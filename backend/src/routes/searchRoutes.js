import express from 'express';
import httpStatus from 'http-status';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// GET /api/search?q=term
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return sendSuccess(res, { data: { users: [], posts: [] } });

    // Use regex for partial matching - only search username
    const searchRegex = new RegExp(q, 'i'); // case-insensitive

    const [users, posts] = await Promise.all([
      User.find({ username: searchRegex })
        .select('username profilePic role')
        .limit(20)
        .lean(),
      Post.find({ caption: searchRegex })
        .populate('author', 'username profilePic role')
        .limit(50)
        .lean(),
    ]);

    return sendSuccess(res, { data: { users, posts } });
  } catch (err) {
    console.error('Search error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Search failed' });
  }
});

export default router;
