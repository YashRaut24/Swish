import express from 'express';
import httpStatus from 'http-status';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/users/:id
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });
    const obj = user.toObject();
    obj.name = obj.name || obj.username;
    return sendSuccess(res, { data: { user: obj } });
  } catch (err) {
    console.error('Get user error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch user' });
  }
});

// PATCH /api/users/me
router.patch('/users/me', authMiddleware, async (req, res) => {
  try {
    const { username, bio, profilePic } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (profilePic !== undefined) updates.profilePic = profilePic;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    const obj = user.toObject();
    obj.name = obj.name || obj.username;
    return sendSuccess(res, { data: { user: obj } });
  } catch (err) {
    console.error('Update profile error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update profile' });
  }
});

// POST /api/users/:id/follow
router.post('/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Cannot follow yourself' });
    }
    const target = await User.findById(targetId);
    if (!target) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });

    const alreadyFollowing = target.followers.map(String).includes(req.user._id.toString());
    const alreadyRequested = target.followRequests.map(String).includes(req.user._id.toString());

    if (alreadyFollowing) {
      return sendSuccess(res, { data: { status: 'following' } });
    }

    if (!alreadyRequested) {
      target.followRequests.push(req.user._id); // incoming for target
      req.user.followRequested.push(target._id); // outgoing for me
      await target.save();
      await req.user.save();

      // Notification: follow request
      try {
        await Notification.create({
          type: 'follow_request',
          actor: req.user._id,
          targetUser: target._id,
        });
      } catch (e) {
        console.warn('Notification create (follow request) failed:', e.message);
      }
    }

    return sendSuccess(res, { data: { status: 'requested' } });
  } catch (err) {
    console.error('Follow error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to follow user' });
  }
});

// DELETE /api/users/:id/follow (unfollow or cancel request)
router.delete('/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const target = await User.findById(targetId);
    if (!target) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });

    // Remove following if exists
    target.followers = target.followers.filter((id) => id.toString() !== req.user._id.toString());
    req.user.following = req.user.following.filter((id) => id.toString() !== targetId);

    // Remove pending requests if any
    target.followRequests = target.followRequests.filter((id) => id.toString() !== req.user._id.toString());
    req.user.followRequested = req.user.followRequested.filter((id) => id.toString() !== targetId);

    await target.save();
    await req.user.save();

    return sendSuccess(res, { data: { status: 'unfollowed' } });
  } catch (err) {
    console.error('Unfollow error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to unfollow user' });
  }
});

// PATCH /api/users/:id/follow/accept (current user accepts requester :id)
router.patch('/users/:id/follow/accept', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.params.id;
    console.log('\n=== ACCEPT FOLLOW REQUEST ===' );
    console.log('Requester ID:', requesterId);
    console.log('Current user:', req.user._id);
    
    const me = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);
    
    console.log('My followRequests:', me.followRequests.map(id => id.toString()));
    
    if (!requester) {
      console.log('ERROR: Requester not found');
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Requester not found' });
    }

    const hasRequest = me.followRequests.some((id) => id.toString() === requesterId);
    console.log('Match found:', hasRequest);
    
    if (!hasRequest) {
      console.log('No follow request - cleaning up stale notification');
      // Clean up the stale notification
      try {
        await Notification.deleteMany({
          type: 'follow_request',
          actor: requesterId,
          targetUser: req.user._id
        });
      } catch (err) {
        console.log('Error cleaning notification:', err);
      }
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Follow request not found or already processed' });
    }

    // remove pending
    me.followRequests = me.followRequests.filter((id) => id.toString() !== requesterId);
    requester.followRequested = requester.followRequested.filter((id) => id.toString() !== me._id.toString());

    // add follow relationship
    me.followers.push(requester._id);
    requester.following.push(me._id);

    await me.save();
    await requester.save();

    // Notification: follow accepted
    try {
      await Notification.create({
        type: 'follow_accept',
        actor: me._id,
        targetUser: requester._id,
      });
    } catch (e) {
      console.warn('Notification create (follow accepted) failed:', e.message);
    }

    return sendSuccess(res, { data: { status: 'following' } });
  } catch (err) {
    console.error('Accept follow error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to accept follow' });
  }
});

// DELETE /api/users/:id/follow/reject (current user rejects requester :id)
router.delete('/users/:id/follow/reject', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const me = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);
    if (!requester) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Requester not found' });

    const hasRequest = me.followRequests.some((id) => id.toString() === requesterId);
    if (!hasRequest) {
      // Clean up the stale notification
      try {
        await Notification.deleteMany({
          type: 'follow_request',
          actor: requesterId,
          targetUser: req.user._id
        });
      } catch (err) {
        console.log('Error cleaning notification:', err);
      }
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Follow request not found or already processed' });
    }

    me.followRequests = me.followRequests.filter((id) => id.toString() !== requesterId);
    requester.followRequested = requester.followRequested.filter((id) => id.toString() !== me._id.toString());
    await me.save();
    await requester.save();

    return sendSuccess(res, { data: { status: 'rejected' } });
  } catch (err) {
    console.error('Reject follow error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to reject follow' });
  }
});

// DELETE /api/users/:id/followers (remove a follower)
router.delete('/users/:id/followers', authMiddleware, async (req, res) => {
  try {
    const followerId = req.params.id;
    const me = await User.findById(req.user._id);
    const follower = await User.findById(followerId);
    
    if (!follower) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Follower not found' });

    const isFollowing = me.followers.map(String).includes(followerId);
    if (!isFollowing) return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Not a follower' });

    // Remove follower
    me.followers = me.followers.filter((id) => id.toString() !== followerId);
    follower.following = follower.following.filter((id) => id.toString() !== me._id.toString());

    await me.save();
    await follower.save();

    return sendSuccess(res, { data: { status: 'removed' } });
  } catch (err) {
    console.error('Remove follower error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to remove follower' });
  }
});

export default router;
