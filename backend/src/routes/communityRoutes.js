import express from 'express';
import httpStatus from 'http-status';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// GET /api/communities
router.get('/communities', authMiddleware, async (req, res) => {
  try {
    const communities = await Community.find()
      .populate('admin', 'username profilePic role')
      .populate('members', 'username profilePic role')
      .lean();
    
    const enriched = communities.map(c => ({
      ...c,
      followers: c.members || [],
      memberCount: (c.members || []).length,
    }));
    
    return sendSuccess(res, { data: { communities: enriched } });
  } catch (err) {
    console.error('Get communities error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch communities' });
  }
});

// POST /api/communities - create community
router.post('/communities', authMiddleware, async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Community name required' });
    }

    const existing = await Community.findOne({ name: name.trim() });
    if (existing) {
      return sendError(res, { status: httpStatus.CONFLICT, message: 'Community name already exists' });
    }

    const community = await Community.create({
      name: name.trim(),
      admin: req.user._id,
      members: [req.user._id],
    });

    // Add community to user
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { communities: community._id } });

    const populated = await Community.findById(community._id)
      .populate('admin', 'username profilePic role')
      .populate('members', 'username profilePic role')
      .lean();

    return sendSuccess(res, { status: httpStatus.CREATED, data: { community: populated } });
  } catch (err) {
    console.error('Create community error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create community' });
  }
});

// GET /api/communities/:id
router.get('/communities/:id', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('admin', 'username profilePic role')
      .populate('members', 'username profilePic role')
      .lean();

    if (!community) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Community not found' });
    }

    return sendSuccess(res, { data: { community } });
  } catch (err) {
    console.error('Get community error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch community' });
  }
});

// POST /api/communities/:id/join
router.post('/communities/:id/join', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Community not found' });
    }

    const isMember = community.members.map(String).includes(req.user._id.toString());
    if (isMember) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Already a member' });
    }

    community.members.push(req.user._id);
    await community.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { communities: community._id } });

    const populated = await Community.findById(community._id)
      .populate('admin', 'username profilePic role')
      .populate('members', 'username profilePic role')
      .lean();

    return sendSuccess(res, { data: { community: populated } });
  } catch (err) {
    console.error('Join community error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to join community' });
  }
});

// POST /api/communities/:id/leave
router.post('/communities/:id/leave', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Community not found' });
    }

    if (community.admin.toString() === req.user._id.toString()) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Admin cannot leave community' });
    }

    community.members = community.members.filter(m => m.toString() !== req.user._id.toString());
    await community.save();

    await User.findByIdAndUpdate(req.user._id, { $pull: { communities: community._id } });

    const populated = await Community.findById(community._id)
      .populate('admin', 'username profilePic role')
      .populate('members', 'username profilePic role')
      .lean();

    return sendSuccess(res, { data: { community: populated } });
  } catch (err) {
    console.error('Leave community error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to leave community' });
  }
});

// DELETE /api/communities/:id - admin only
router.delete('/communities/:id', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Community not found' });
    }

    if (community.admin.toString() !== req.user._id.toString()) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only admin can delete community' });
    }

    // Remove from all users
    await User.updateMany(
      { communities: community._id },
      { $pull: { communities: community._id } }
    );

    await community.deleteOne();

    return sendSuccess(res, { data: { deleted: true } });
  } catch (err) {
    console.error('Delete community error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete community' });
  }
});

export default router;
