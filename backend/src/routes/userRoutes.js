import express from 'express';
import httpStatus from 'http-status';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import Notification from '../models/Notification.js';

const router = express.Router();


router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('eventHostRoles.eventId', 'title').populate('communityRoles.communityId', 'name');
    if (!user) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });
    const obj = user.toObject();
    obj.name = obj.name || obj.username;
    return sendSuccess(res, { data: { user: obj } });
  } catch (err) {
    console.error('Get user error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch user' });
  }
});


router.get('/users/me/community-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followedCommunities', '_id').populate('communities', '_id');
    const joinRequests = await JoinRequest.find({ userId: req.user._id }).populate('communityId', '_id');

    return sendSuccess(res, {
      data: {
        followedCommunities: user.followedCommunities.map(c => c._id.toString()),
        joinedCommunities: user.communities.map(c => c._id.toString()),
        joinRequests: joinRequests.map(jr => ({
          communityId: jr.communityId._id.toString(),
          status: jr.status
        }))
      }
    });
  } catch (err) {
    console.error('Get community status error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch community status' });
  }
});


router.patch('/users/me', authMiddleware, async (req, res) => {
  try {
    const { name, username, bio, profilePic, profilePicture, designation, department, subjects } = req.body;
    const updates = {};
    if (name) updates.username = name;
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (profilePic !== undefined) updates.profilePic = profilePic;
    if (profilePicture !== undefined) updates.profilePic = profilePicture;
    
    if (req.user.role === 'Faculty') {
      if (designation !== undefined) updates.designation = designation;
      if (department !== undefined) updates.department = department;
      if (subjects !== undefined) updates.subjects = subjects;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    const obj = user.toObject();
    obj.name = obj.name || obj.username;
    return sendSuccess(res, { data: { user: obj } });
  } catch (err) {
    console.error('Update profile error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update profile' });
  }
});


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
      target.followRequests.push(req.user._id); 
      req.user.followRequested.push(target._id); 
      await target.save();
      await req.user.save();

      
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


router.delete('/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const target = await User.findById(targetId);
    if (!target) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });

    
    target.followers = target.followers.filter((id) => id.toString() !== req.user._id.toString());
    req.user.following = req.user.following.filter((id) => id.toString() !== targetId);

    
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

    
    me.followers.push(requester._id);
    requester.following.push(me._id);

    await me.save();
    await requester.save();

    
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


router.delete('/users/:id/follow/reject', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const me = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);
    if (!requester) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Requester not found' });

    const hasRequest = me.followRequests.some((id) => id.toString() === requesterId);
    if (!hasRequest) {
      
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


router.delete('/users/:id/followers', authMiddleware, async (req, res) => {
  try {
    const followerId = req.params.id;
    const me = await User.findById(req.user._id);
    const follower = await User.findById(followerId);
    
    if (!follower) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Follower not found' });

    const isFollowing = me.followers.map(String).includes(followerId);
    if (!isFollowing) return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Not a follower' });

    
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


router.post('/users/:id/mute', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Faculty') {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can mute students' });
    }

    const studentId = req.params.id;
    const student = await User.findById(studentId);
    
    if (!student) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Student not found' });
    }

    
    const isMuted = student.mutedBy.map(String).includes(req.user._id.toString());
    if (isMuted) {
      return sendSuccess(res, { data: { message: 'Student already muted' } });
    }

    student.mutedBy.push(req.user._id);
    await student.save();

    const obj = student.toObject();
    obj.name = obj.name || obj.username;
    return sendSuccess(res, { status: httpStatus.OK, data: { user: obj, message: 'Student muted' } });
  } catch (err) {
    console.error('Mute student error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to mute student' });
  }
});


router.delete('/users/:id/mute', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Faculty') {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can unmute students' });
    }

    const studentId = req.params.id;
    const student = await User.findById(studentId);
    
    if (!student) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Student not found' });
    }

    student.mutedBy = student.mutedBy.filter((id) => id.toString() !== req.user._id.toString());
    await student.save();

    const obj = student.toObject();
    obj.name = obj.name || obj.username;
    return sendSuccess(res, { status: httpStatus.OK, data: { user: obj, message: 'Student unmuted' } });
  } catch (err) {
    console.error('Unmute student error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to unmute student' });
  }
});

export default router;
