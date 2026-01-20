import express from 'express';
import httpStatus from 'http-status';
import Community from '../models/Community.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import JoinRequest from '../models/JoinRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const serializeCommunity = (community) => {
  if (!community) return community;
  const obj = community.toObject ? community.toObject() : community;
  return obj;
};

router.get('/communities', async (request, response) => {
  try {
    let communities = await Community.find({})
      .populate('admin', 'username profilePic role')
      .populate('members', 'username profilePic role')
      .populate('pendingMembers', 'username profilePic role')
      .populate('pendingRoles.userId', 'username profilePic role')
      .populate('pendingRoles.proposedBy', 'username')
      .sort({ createdAt: -1 });



    return sendSuccess(response, { data: { communities: communities.map(serializeCommunity) } });
  } catch (err) {
    console.error('Get communities error:', err);
    return sendError(response, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch communities' });
  }
});

router.post('/communities', authMiddleware, async (request, response) => {
  try {

    if (request.user.role !== 'Faculty') return sendError(response, { status: httpStatus.FORBIDDEN, message: 'Only faculty members can create communities' });

    const { name, president, generalSecretary } = request.body;
    if (!name) return sendError(response, { status: httpStatus.BAD_REQUEST, message: 'Name required' });

    const communityId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).substr(2, 9);
    const community = await Community.create({
      communityId,
      name,
      admin: request.user._id,
      members: [request.user._id],
      roles: [{ userId: request.user._id, role: "Creator / Faculty" }],
      isFacultyChannel: true,
    });

    request.user.communityRoles.push({ communityId: community._id, role: "Creator / Faculty" });
    await request.user.save();

    if (president) {
      const presidentUser = await User.findById(president);
      if (presidentUser) {
        const existingRole = presidentUser.communityRoles.find(r => r.communityId.toString() === community._id.toString());
        if (!existingRole) {
          presidentUser.communityRoles.push({ communityId: community._id, role: 'Community President' });
          await presidentUser.save();
        }
      }
    }

    if (generalSecretary) {
      const secretaryUser = await User.findById(generalSecretary);
      if (secretaryUser) {
        const existingRole = secretaryUser.communityRoles.find(r => r.communityId.toString() === community._id.toString());
        if (!existingRole) {
          secretaryUser.communityRoles.push({ communityId: community._id, role: 'Community General Secretary' });
          await secretaryUser.save();
        }
      }
    }

    const populated = await Community.findById(community._id)
      .populate('admin', 'username profilePic role')
      .populate('members', 'username profilePic role');

    return sendSuccess(response, { status: httpStatus.CREATED, data: { community: serializeCommunity(populated) } });
  } catch (err) {
    console.error('Create community error:', err);
    return sendError(response, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create community' });
  }
});

router.post('/communities/:id/join', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Community not found' });

    if (req.user._id.toString() === community.admin.toString()) return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Creators cannot join their own community' });

    const userId = req.user._id.toString();
    const isMember = community.members.map(String).includes(userId);

    if (isMember) return sendSuccess(res, { data: { status: 'member' } });

    const existingRequest = await JoinRequest.findOne({ userId: req.user._id, communityId: community._id });
    if (existingRequest) return sendSuccess(res, { data: { status: 'pending' } });

    await JoinRequest.create({
      userId: req.user._id,
      communityId: community._id,
      status: 'pending'
    });

    try {
      
      const facultyMembers = await User.find({ role: 'Faculty' });
      const facultyIds = facultyMembers.map(f => f._id.toString());

      
      if (facultyIds.includes(community.admin.toString())) {
        await Notification.create({
          type: 'community_join_request',
          actor: req.user._id,
          targetUser: community.admin,
          community: community._id,
          requesterId: req.user._id,
          requesterName: req.user.username,
          communityId: community._id,
          communityName: community.name,
          requestType: 'join_request',
        });
      }

      
      const president = await User.findOne({
        'communityRoles.communityId': community._id,
        'communityRoles.role': 'Community President',
        role: 'Faculty'
      });
      if (president) {
        await Notification.create({
          type: 'community_join_request',
          actor: req.user._id,
          targetUser: president._id,
          community: community._id,
          requesterId: req.user._id,
          requesterName: req.user.username,
          communityId: community._id,
          communityName: community.name,
          requestType: 'join_request',
        });
      }

      
      const secretary = await User.findOne({
        'communityRoles.communityId': community._id,
        'communityRoles.role': 'Community General Secretary',
        role: 'Faculty'
      });
      if (secretary) {
        await Notification.create({
          type: 'community_join_request',
          actor: req.user._id,
          targetUser: secretary._id,
          community: community._id,
          requesterId: req.user._id,
          requesterName: req.user.username,
          communityId: community._id,
          communityName: community.name,
          requestType: 'join_request',
        });
      }
    } catch (e) {
      console.warn('Notification create failed:', e.message);
    }

    return sendSuccess(res, { data: { status: 'pending' } });
  } catch (err) {
    console.error('Join community error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to join community' });
  }
});

router.post('/communities/:id/follow', authMiddleware, async (request, response) => {
  try {
    const community = await Community.findById(request.params.id);
    if (!community) return sendError(response, { status: httpStatus.NOT_FOUND, message: 'Community not found' });

    if (request.user._id.toString() === community.admin.toString()) return sendError(response, { status: httpStatus.FORBIDDEN, message: 'Creators cannot follow their own community' });

    const userId = request.user._id.toString();
    const isMember = community.members.map(String).includes(userId);
    const isFollowing = request.user.followedCommunities.map(String).includes(request.params.id);

    if (isMember) return sendSuccess(response, { data: { status: 'member' } });

    if (isFollowing) {
      
      request.user.followedCommunities = request.user.followedCommunities.filter(id => id.toString() !== request.params.id);
      await request.user.save();
      return sendSuccess(response, { data: { status: 'unfollowed' } });
    } else {
      
      request.user.followedCommunities.push(request.params.id);
      await request.user.save();
      return sendSuccess(response, { data: { status: 'followed' } });
    }
  } catch (err) {
    console.error('Follow community error:', err);
    return sendError(response, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to follow/unfollow community' });
  }
});


router.post('/communities/:id/approve/:userId', authMiddleware, async (request, response) => {
  try {
    const community = await Community.findById(request.params.id);
    if (!community) return sendError(response, { status: httpStatus.NOT_FOUND, message: 'Community not found' });


    const isFaculty = request.user.role === 'Faculty';
    const communityRole = request.user.communityRoles.find(r => r.communityId.toString() === request.params.id);
    const isPresident = communityRole && communityRole.role === 'Community President';
    const isSecretary = communityRole && communityRole.role === 'Community General Secretary';
    if (!isFaculty && !isPresident && !isSecretary) {
      return sendError(response, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }


    const joinRequest = await JoinRequest.findOne({
      userId: request.params.userId,
      communityId: request.params.id,
      status: 'pending'
    });
    if (!joinRequest) return sendError(response, { status: httpStatus.NOT_FOUND, message: 'Pending request not found' });


    joinRequest.status = 'accepted';
    await joinRequest.save();


    if (!community.members.includes(request.params.userId)) {
      community.members.push(request.params.userId);
      await community.save();
    }


    try {
      await Notification.create({
        type: 'community_join_accept',
        actor: request.user._id,
        targetUser: request.params.userId,
        community: community._id,
      });
    } catch (e) {
      console.warn('Notification create failed:', e.message);
    }

  return sendSuccess(response, { data: { approved: true } });
  } catch (err) {
    console.error('Approve member error:', err);
    return sendError(response, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to approve member' });
  }
});


router.post('/communities/:id/reject/:userId', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Community not found' });

    
    const isFaculty = req.user.role === 'Faculty';
    const communityRole = req.user.communityRoles.find(r => r.communityId.toString() === req.params.id);
    const isPresident = communityRole && communityRole.role === 'Community President';
    const isSecretary = communityRole && communityRole.role === 'Community General Secretary';
    if (!isFaculty && !isPresident && !isSecretary) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }

    
    const joinRequest = await JoinRequest.findOne({
      userId: req.params.userId,
      communityId: req.params.id,
      status: 'pending'
    });
    if (!joinRequest) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Pending request not found' });

    
    joinRequest.status = 'rejected';
    await joinRequest.save();

    return sendSuccess(res, { data: { rejected: true } });
  } catch (err) {
    console.error('Reject member error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to reject member' });
  }
});


router.post('/communities/:id/mute/:userId', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community || community.admin.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }

    if (!community.mutedUsers.includes(req.params.userId)) {
      community.mutedUsers.push(req.params.userId);
      await community.save();
    }

    return sendSuccess(res, { data: { muted: true } });
  } catch (err) {
    console.error('Mute member error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to mute member' });
  }
});


router.delete('/communities/:id/mute/:userId', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community || community.admin.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }

    community.mutedUsers = community.mutedUsers.filter(id => id.toString() !== req.params.userId);
    await community.save();

    return sendSuccess(res, { data: { muted: false } });
  } catch (err) {
    console.error('Unmute member error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to unmute member' });
  }
});


router.post('/communities/:id/propose-role', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Community not found' });

    const { userId, role } = req.body;
    if (!userId || !role) return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'User ID and role required' });

    const allowedRoles = [
      'Vice President',
      'Joint Secretary',
      'Treasurer',
      'Technical Head',
      'Event Head',
      'Operations Head',
      'PR / Publicity Head',
      'Marketing / Social Media Head',
      'Core Committee Member',
      'Volunteer'
    ];
    if (!allowedRoles.includes(role)) return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Invalid role' });

    
    const proposerRole = req.user.communityRoles.find(r => r.communityId.toString() === req.params.id);
    if (!proposerRole || !['Community President', 'Community General Secretary'].includes(proposerRole.role)) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }

    
    const existingPending = community.pendingRoles.find(p => p.userId.toString() === userId && p.role === role);
    if (existingPending) return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Role already proposed' });

    community.pendingRoles.push({ userId, role, proposedBy: req.user._id });
    await community.save();

    
    try {
      await Notification.create({
        type: 'community_role_proposal',
        actor: req.user._id,
        targetUser: community.admin,
        community: community._id,
        metadata: { userId, role }
      });
    } catch (e) {
      console.warn('Notification create failed:', e.message);
    }

    return sendSuccess(res, { data: { proposed: true } });
  } catch (err) {
    console.error('Propose role error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to propose role' });
  }
});


router.post('/communities/:id/approve-role/:index', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community || community.admin.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not allowed' });
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= community.pendingRoles.length) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Invalid index' });
    }

    const pendingRole = community.pendingRoles[index];
    const user = await User.findById(pendingRole.userId);
    if (!user) return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });

    
    const existingRole = user.communityRoles.find(r => r.communityId.toString() === req.params.id);
    if (!existingRole) {
      user.communityRoles.push({ communityId: req.params.id, role: pendingRole.role });
    } else {
      existingRole.role = pendingRole.role;
    }

    
    if (!community.members.includes(pendingRole.userId)) {
      community.members.push(pendingRole.userId);
    }

    
    community.pendingRoles.splice(index, 1);

    await user.save();
    await community.save();

    return sendSuccess(res, { data: { approved: true } });
  } catch (err) {
    console.error('Approve role error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to approve role' });
  }
});

export default router;
