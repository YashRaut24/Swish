import express from 'express';
import httpStatus from 'http-status';
import Post from '../models/Post.js';
import Broadcast from '../models/Broadcast.js';
import Community from '../models/Community.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();


const serializePost = (post) => {
  if (!post) return post;
  const obj = post.toObject ? post.toObject() : post;
  return {
    ...obj,
    
  };
};


const populatePost = async (postId) => {
  return Post.findById(postId)
    .populate('author', 'username profilePic email role')
    .populate('comments.user', 'username profilePic');
};

router.post('/posts', authMiddleware, upload.none(), async (req, res) => {
  try {
    const { caption = '', media = '[]', isFacultyPost, pollOptions, channel, isBroadcast, broadcastTarget, isImportant, isExamRelated } = req.body;
    let mediaArray = [];
    try {
      mediaArray = typeof media === 'string' ? JSON.parse(media) : media;
    } catch (e) {
      mediaArray = [];
    }

    if (isFacultyPost && req.user.role !== 'Faculty') return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    if (pollOptions && req.user.role !== 'Faculty') return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    if (isBroadcast && req.user.role !== 'Faculty') return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    if (channel && channel !== 'College Announcements') {
      const community = await Community.findOne({ name: channel });
      if (community && community.isAnnouncement && req.user.role !== 'Faculty') {
        return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can post in announcement communities' });
      }
    }

    
    if (channel && channel !== 'College Announcements') {
      const community = await Community.findOne({ name: channel });
      if (community) {
        const isFaculty = req.user.role === 'Faculty';
        const userCommunityRole = req.user.communityRoles.find(role => role.communityId.toString() === community._id.toString());
        const isPresident = userCommunityRole && userCommunityRole.role === 'Community President';
        const isGeneralSecretary = userCommunityRole && userCommunityRole.role === 'Community General Secretary';

        if (!isFaculty && !isPresident && !isGeneralSecretary) {
          return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty, community president, or general secretary can post in this community' });
        }
      }
    }

    const post = await Post.create({
      author: req.user._id,
      caption,
      media: mediaArray,
      likes: [],
      comments: [],
      savedBy: [],
      isFacultyPost: isFacultyPost || false,
      isVerified: isFacultyPost || false,
      pollOptions: pollOptions || [],
      channel,
      isBroadcast: isBroadcast || false,
      broadcastTarget,
      isImportant: isImportant || false,
      isExamRelated: isExamRelated || false,
    });

    const populated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.CREATED, data: { post: serializePost(populated) } });
  } catch (err) {
    console.error('Create post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create post' });
  }
});


router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const { author } = req.query;
    let query = {};

    
    if (author) {
      query.author = author;
    }

    const posts = await Post.find(query)
      .populate('author', 'username profilePic email role')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { status: httpStatus.OK, data: { posts: posts.map(serializePost) } });
  } catch (err) {
    console.error('Get posts error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch posts' });
  }
});


router.get('/posts/community', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username profilePic email role')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 })
      .lean();

    const communityPosts = posts.filter(post => post.author?.role === 'Community').map(serializePost);
    return sendSuccess(res, { status: httpStatus.OK, data: { posts: communityPosts } });
  } catch (err) {
    console.error('Get community posts error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch community posts' });
  }
});


router.get('/posts/saved', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ savedBy: req.user._id })
      .populate('author', 'username profilePic email role')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { status: httpStatus.OK, data: { posts: posts.map(serializePost) } });
  } catch (err) {
    console.error('Get saved posts error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch saved posts' });
  }
});


router.get('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePic email role')
      .populate('comments.user', 'username profilePic');
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }
    
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(post) } });
  } catch (err) {
    console.error('Get post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch post' });
  }
});


router.patch('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }
    
    if (post.author.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized' });
    }

    const { caption, media } = req.body;
    if (caption !== undefined) post.caption = caption;
    if (media !== undefined) post.media = media;

    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Update post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update post' });
  }
});


router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }
    
    if (post.author.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    return sendSuccess(res, { status: httpStatus.OK, data: { message: 'Post deleted' } });
  } catch (err) {
    console.error('Delete post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete post' });
  }
});


router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Like post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to like post' });
  }
});


router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    if (post.channel === 'College Announcements' && req.user.role !== 'Faculty') {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can comment in College Announcements' });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.CREATED, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Comment post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to add comment' });
  }
});


router.patch('/posts/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized' });
    }

    comment.text = text.trim();
    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Update comment error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update comment' });
  }
});


router.delete('/posts/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized' });
    }

    post.comments.id(req.params.commentId).deleteOne();
    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Delete comment error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete comment' });
  }
});


router.post('/posts/:id/save', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const saveIndex = post.savedBy.indexOf(userId);

    if (saveIndex === -1) {
      post.savedBy.push(userId);
    }

    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Save post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to save post' });
  }
});


router.delete('/posts/:id/save', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const saveIndex = post.savedBy.indexOf(userId);

    if (saveIndex > -1) {
      post.savedBy.splice(saveIndex, 1);
    }

    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Unsave post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to unsave post' });
  }
});


router.post('/posts/:id/share', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    if (!post.shares) post.shares = 0;
    post.shares += 1;

    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Share post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to share post' });
  }
});


router.patch('/posts/:id/hide', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Faculty') {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can hide posts' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    post.isHidden = true;
    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Hide post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to hide post' });
  }
});


router.patch('/posts/:id/unhide', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Faculty') {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can unhide posts' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    post.isHidden = false;
    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated) } });
  } catch (err) {
    console.error('Unhide post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to unhide post' });
  }
});


router.post('/posts/:id/report', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Faculty') {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can report posts' });
    }

    const { reason } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Post not found' });
    }

    
    post.isImportant = true;
    await post.save();
    const updated = await populatePost(post._id);
    return sendSuccess(res, { status: httpStatus.OK, data: { post: serializePost(updated), message: 'Post marked for priority review' } });
  } catch (err) {
    console.error('Report post error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to report post' });
  }
});


router.post('/broadcasts', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Faculty') {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can send broadcasts' });
    }

    const { message, target, targetClass, targetDepartment } = req.body;
    
    if (!message || !message.trim()) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Message is required' });
    }

    const broadcast = await Broadcast.create({
      sender: req.user._id,
      message: message.trim(),
      target: target || 'all',
      targetClass: targetClass || '',
      targetDepartment: targetDepartment || '',
      readBy: [],
    });

    const populated = await broadcast.populate('sender', 'name username profilePicture');
    return sendSuccess(res, { status: httpStatus.CREATED, data: { broadcast: populated } });
  } catch (err) {
    console.error('Create broadcast error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to send broadcast' });
  }
});


router.get('/broadcasts', authMiddleware, async (req, res) => {
  try {
    const broadcasts = await Broadcast.find()
      .populate('sender', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .lean();
    
    return sendSuccess(res, { status: httpStatus.OK, data: { broadcasts } });
  } catch (err) {
    console.error('Get broadcasts error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch broadcasts' });
  }
});


router.patch('/broadcasts/:id/read', authMiddleware, async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    
    if (!broadcast) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Broadcast not found' });
    }

    const userId = req.user._id.toString();
    const hasRead = broadcast.readBy.map(String).includes(userId);

    if (!hasRead) {
      broadcast.readBy.push(req.user._id);
      await broadcast.save();
    }

    const populated = await broadcast.populate('sender', 'name username profilePicture');
    return sendSuccess(res, { status: httpStatus.OK, data: { broadcast: populated } });
  } catch (err) {
    console.error('Mark broadcast read error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to mark broadcast as read' });
  }
});

export default router;
