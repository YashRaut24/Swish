import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();



router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ targetUser: req.user._id })
      .sort({ createdAt: -1 })
      .populate('actor', 'username profilePic role')
      .populate('post', '_id caption')
      .lean();
    
    
    const me = await User.findById(req.user._id);
    const validFollowRequests = me.followRequests.map(id => id.toString());
    
    const staleNotificationIds = [];
    const validNotifications = notifications.filter(notif => {
      if (notif.type === 'follow_request') {
        const actorId = notif.actor?._id?.toString() || notif.actor?.toString();
        if (!validFollowRequests.includes(actorId)) {
          staleNotificationIds.push(notif._id);
          return false; 
        }
      }
      return true; 
    });
    
    
    if (staleNotificationIds.length > 0) {
      await Notification.deleteMany({ _id: { $in: staleNotificationIds } });
      console.log(`Cleaned up ${staleNotificationIds.length} stale follow request notifications`);
    }
    
    return sendSuccess(res, { data: { notifications: validNotifications } });
  } catch (err) {
    console.error('Load notifications error:', err);
    return sendError(res, { message: 'Failed to load notifications' });
  }
});


router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, targetUser: req.user._id }, { read: true });
    return sendSuccess(res, { data: { read: true } });
  } catch (err) {
    return sendError(res, { message: 'Failed to mark read' });
  }
});


router.patch('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ targetUser: req.user._id }, { read: true });
    return sendSuccess(res, { data: { read: true } });
  } catch (err) {
    return sendError(res, { message: 'Failed to mark all read' });
  }
});

export default router;
