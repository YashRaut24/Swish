import express from 'express';
import multer from 'multer';
import httpStatus from 'http-status';
import Post from '../models/Post.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import Notification from '../models/Notification.js';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to shape post for frontend
const serializePost = (post) => {
  if (!post) return post;
  const obj = post.toObject ? post.toObject() : post;
  const author = obj.author || obj.user;
  const authorWithName = author
    ? { ...author, name: author.name || author.username }
    : author;
  
  // Serialize comments to have 'author' instead of 'user'
  const comments = obj.comments?.map(comment => {
    const actor = comment.user || comment.author;
    const authorWithName = actor
      ? { ...actor, name: actor.name || actor.username }
      : actor;
    return {
      ...comment,
      author: authorWithName,
      user: undefined, // remove the old field
    };
  }) || [];
  
  return {
    ...obj,
    author: authorWithName,
    comments
  };
};

// GET /api/posts
router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const { author } = req.query;
    const filter = author ? { author } : {};

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePic role')
      .lean();
    return sendSuccess(res, { data: { posts: posts.map(serializePost) } });
  } catch (err) {
    console.error('Get posts error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch posts' });
  }
});

// POST /api/posts - create post (caption + media array)
router.post('/posts', authMiddleware, upload.none(), async (req, res) => {
  try {
    const { caption = '', media = '[]' } = req.body;
    let mediaArray = [];
    try {
      mediaArray = typeof media === 'string' ? JSON.parse(media) : media;
    } catch (e) {
      mediaArray = [];
    }

    const post = await Post.create({
      author: req.user._id,
      caption,
      media: mediaArray,
      likes: [],
      comments: [],
      savedBy: [],
    });

    const populated = await Post.findById(post._id).populate('author', 'username profilePic role');
    return sendSuccess(res, { status: httpStatus.CREATED, data: { post: serializePost(populated) } });
  } catch (err) {
    console.error('Create post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create post' });
  }
});

// PATCH /api/posts/:id - update post caption
router.patch('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { caption } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }
    if (caption !== undefined) post.caption = caption;
    await post.save();

    // Create notification when someone likes another user's post
    try {
      if (!hasLiked && post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          type: 'like',
          actor: req.user._id,
          targetUser: post.author,
          post: post._id,
        });
      }
    } catch (e) {
      console.warn('Notification create (like) failed:', e.message);
    }
    const populated = await Post.findById(post._id).populate('author', 'username profilePic role');
    return sendSuccess(res, { data: { post: serializePost(populated) } });
  } catch (err) {
    console.error('Update post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id
router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }
    // delete media from cloudinary
    try {
      const publicIds = (post.media || []).map((m) => m.publicId).filter(Boolean);
      for (const pid of publicIds) {
        await cloudinary.uploader.destroy(pid, { invalidate: true });
      }
    } catch (e) {
      console.warn('Cloudinary cleanup failed:', e.message);
    }
    await post.deleteOne();
    return sendSuccess(res, { data: { deleted: true } });
  } catch (err) {
    console.error('Delete post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete post' });
  }
});

// POST /api/posts/:id/like (toggle)
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    const uid = req.user._id.toString();
    const hasLiked = post.likes.map(String).includes(uid);
    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== uid);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    const populated = await Post.findById(post._id).populate('author', 'username profilePic role');
    return sendSuccess(res, { data: { post: serializePost(populated) } });
  } catch (err) {
    console.error('Like post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to like post' });
  }
});

// POST /api/posts/:id/comments
router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { text = '' } = req.body;
    if (!text.trim()) return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Comment text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    post.comments.push({ user: req.user._id, text });
    await post.save();

    // Notify post author about new comment
    try {
      if (post.author.toString() !== req.user._id.toString()) {
        const added = post.comments[post.comments.length - 1];
        await Notification.create({
          type: 'comment',
          actor: req.user._id,
          targetUser: post.author,
          post: post._id,
          commentId: added?._id,
        });
      }
    } catch (e) {
      console.warn('Notification create (comment) failed:', e.message);
    }
    const populated = await Post.findById(post._id)
      .populate('author', 'username profilePic role')
      .populate('comments.user', 'username profilePic role')
      .lean();
    return sendSuccess(res, { data: { post: serializePost(populated) } });
  } catch (err) {
    console.error('Comment post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to comment' });
  }
});

// PATCH /api/posts/:postId/comments/:commentId - update comment
router.patch('/posts/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Comment text required' });
    const post = await Post.findById(req.params.postId);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }
    comment.text = text;
    await post.save();
    const populated = await Post.findById(post._id)
      .populate('author', 'username profilePic role')
      .populate('comments.user', 'username profilePic role')
      .lean();
    return sendSuccess(res, { data: { post: serializePost(populated) } });
  } catch (err) {
    console.error('Update comment error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update comment' });
  }
});

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/posts/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString() && post.author.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }
    comment.deleteOne();
    await post.save();
    const populated = await Post.findById(post._id)
      .populate('author', 'username profilePic role')
      .populate('comments.user', 'username profilePic role')
      .lean();
    return sendSuccess(res, { data: { post: serializePost(populated) } });
  } catch (err) {
    console.error('Delete comment error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete comment' });
  }
});

// GET /api/posts/saved
router.get('/posts/saved', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ savedBy: req.user._id })
      .populate('author', 'username profilePic role')
      .lean();
    return sendSuccess(res, { data: { posts: posts.map(serializePost) } });
  } catch (err) {
    console.error('Saved posts error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch saved posts' });
  }
});

// POST /api/posts/:id/save (toggle)
router.post('/posts/:id/save', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    const uid = req.user._id.toString();
    const saved = post.savedBy.map(String).includes(uid);
    if (saved) {
      post.savedBy = post.savedBy.filter((id) => id.toString() !== uid);
    } else {
      post.savedBy.push(req.user._id);
    }
    await post.save();
    return sendSuccess(res, { data: { saved: !saved } });
  } catch (err) {
    console.error('Save post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to save post' });
  }
});

// DELETE /api/posts/:id/save (unsave)
router.delete('/posts/:id/save', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    post.savedBy = post.savedBy.filter((id) => id.toString() !== req.user._id.toString());
    await post.save();
    return sendSuccess(res, { data: { saved: false } });
  } catch (err) {
    console.error('Unsave post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to unsave post' });
  }
});

// POST /api/posts/:id/share (stub)
router.post('/posts/:id/share', authMiddleware, async (req, res) => {
  return sendSuccess(res, { data: { shared: true } });
});

export default router;
