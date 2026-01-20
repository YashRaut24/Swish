import express from 'express';
import httpStatus from 'http-status';
import Event from '../models/Event.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();


const serializeEvent = (event) => {
  if (!event) return event;
  const obj = event.toObject ? event.toObject() : event;
  return {
    ...obj,
    status: event.status, 
  };
};


const canManageEvent = async (user, eventId) => {
  if (user.role === 'Faculty') return true;
  const userDoc = await User.findById(user._id);
  return userDoc.eventHostRoles.some(role => role.eventId.toString() === eventId.toString() && role.role === 'Event Host');
};


router.get('/events', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({})
      .populate('organizer', 'username profilePic role')
      .populate('joinedUsers', 'username profilePic role')
      .sort({ startTime: 1 })
      .lean();

    return sendSuccess(res, { data: { events: events.map(serializeEvent) } });
  } catch (err) {
    console.error('Get events error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch events' });
  }
});


router.post('/events', authMiddleware, async (req, res) => {
  try {
    const { title, description, startTime, endTime, location, isVerified } = req.body;

    if (!title || !description || !startTime || !endTime) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'All fields are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'End time must be after start time' });
    }

    
    const eventIsVerified = req.user.role === 'Faculty' && isVerified;

    const event = await Event.create({
      title,
      description,
      location,
      organizer: req.user._id,
      startTime: start,
      endTime: end,
      joinedUsers: [req.user._id], 
      isVerified: eventIsVerified,
    });

    const populated = await Event.findById(event._id)
      .populate('organizer', 'username profilePic role')
      .populate('joinedUsers', 'username profilePic role');

    return sendSuccess(res, { status: httpStatus.CREATED, data: { event: serializeEvent(populated) } });
  } catch (err) {
    console.error('Create event error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create event' });
  }
});


router.get('/events/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username profilePic role')
      .populate('joinedUsers', 'username profilePic role');

    if (!event) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Event not found' });
    }

    
    
    const posts = await Post.find({ caption: { $regex: event.title, $options: 'i' } })
      .populate('author', 'username profilePic role')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, {
      data: {
        event: serializeEvent(event),
        posts: posts.map(post => ({
          ...post,
          author: post.author ? { ...post.author, name: post.author.username } : post.author,
        }))
      }
    });
  } catch (err) {
    console.error('Get event error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch event' });
  }
});


router.post('/events/:id/join', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Event not found' });
    }

    const userId = req.user._id.toString();
    const isJoined = event.joinedUsers.map(String).includes(userId);

    if (isJoined) {
      
      event.joinedUsers = event.joinedUsers.filter(id => id.toString() !== userId);
    } else {
      
      event.joinedUsers.push(req.user._id);
    }

    await event.save();

    const populated = await Event.findById(event._id)
      .populate('organizer', 'username profilePic role')
      .populate('joinedUsers', 'username profilePic role');

    return sendSuccess(res, {
      data: {
        event: serializeEvent(populated),
        joined: !isJoined
      }
    });
  } catch (err) {
    console.error('Join event error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to join/leave event' });
  }
});


router.post('/events/:id/members', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'User ID is required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Event not found' });
    }

    const canManage = await canManageEvent(req.user, req.params.id);
    if (!canManage) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized to manage this event' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'User not found' });
    }

    if (event.joinedUsers.map(String).includes(userId)) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'User is already a member' });
    }

    event.joinedUsers.push(userId);
    await event.save();

    const populated = await Event.findById(event._id)
      .populate('organizer', 'username profilePic role')
      .populate('joinedUsers', 'username profilePic role');

    return sendSuccess(res, { data: { event: serializeEvent(populated) } });
  } catch (err) {
    console.error('Add member error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to add member' });
  }
});


router.delete('/events/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Event not found' });
    }

    const canManage = await canManageEvent(req.user, req.params.id);
    if (!canManage) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized to manage this event' });
    }

    const userId = req.params.userId;
    if (!event.joinedUsers.map(String).includes(userId)) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'User is not a member' });
    }

    event.joinedUsers = event.joinedUsers.filter(id => id.toString() !== userId);
    await event.save();

    const populated = await Event.findById(event._id)
      .populate('organizer', 'username profilePic role')
      .populate('joinedUsers', 'username profilePic role');

    return sendSuccess(res, { data: { event: serializeEvent(populated) } });
  } catch (err) {
    console.error('Remove member error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to remove member' });
  }
});

export default router;
