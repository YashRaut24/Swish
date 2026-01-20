import express from 'express';
import httpStatus from 'http-status';
import Post from '../models/Post.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();


router.get('/explore/top', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      {
        $addFields: {
          score: { $add: ['$likesCount', { $multiply: ['$commentsCount', 2] }] },
        },
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 50 },
    ]);

    const ids = posts.map((p) => p._id);
    const populated = await Post.find({ _id: { $in: ids } })
      .populate('author', 'username profilePic role')
      .lean();

    
    const map = new Map(populated.map((p) => [p._id.toString(), p]));
    const ordered = posts.map((p) => map.get(p._id.toString())).filter(Boolean);
    return sendSuccess(res, { data: { posts: ordered } });
  } catch (err) {
    console.error('Explore top error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load trending' });
  }
});


router.get('/explore/hashtags', authMiddleware, async (req, res) => {
  return sendSuccess(res, { data: { hashtags: ['#campus', '#events', '#coding', '#sports'] } });
});

export default router;
