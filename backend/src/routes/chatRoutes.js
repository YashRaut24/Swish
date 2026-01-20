import express from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Community from '../models/Community.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

router.get('/chats', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username profilePic role')
      .sort({ updatedAt: -1 })
      .lean();
    return sendSuccess(res, { data: { chats } });
  } catch (err) {
    console.error('Get chats error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch chats' });
  }
});

router.get('/chats/community', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username profilePic role')
      .sort({ updatedAt: -1 })
      .lean();

    const communityChats = chats.filter(chat =>
      chat.participants.some(p => p.role === 'Community')
    );
    return sendSuccess(res, { data: { chats: communityChats } });
  } catch (err) {
    console.error('Get community chats error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch community chats' });
  }
});

router.post('/chats/send', authMiddleware, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'recipientId and message required' });
    }

    
    const recipientIdObj = new mongoose.Types.ObjectId(recipientId);

    const recipient = await Chat.findOne({ participants: recipientIdObj }).populate('participants', 'role communityRoles');
    const recipientUser = recipient ? recipient.participants.find(p => p._id.toString() === recipientId.toString()) : null;

    if (recipientUser && recipientUser.role === 'Community') {
      const community = await Community.findOne({ name: recipientUser.username });
      if (community) {
        if (community.isAnnouncement && req.user.role !== 'Faculty') {
          return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty can message in announcement communities' });
        }
        const isFaculty = req.user.role === 'Faculty';
        const userCommunityRole = req.user.communityRoles.find(role => role.communityId.toString() === community._id.toString());
        const isPresident = userCommunityRole && userCommunityRole.role === 'Community President';
        const isGeneralSecretary = userCommunityRole && userCommunityRole.role === 'Community General Secretary';

        if (!isFaculty && !isPresident && !isGeneralSecretary) {
          return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Only faculty, community president, or general secretary can message in this community' });
        }
      }
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, recipientIdObj], $size: 2 },
      isGroup: false,
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, recipientIdObj],
        messages: [],
        isGroup: false
      });
    }

    chat.messages.push({
      sender: req.user._id,
      senderId: req.user._id.toString(),
      receiverId: recipientId.toString(),
      text: message,
      timestamp: new Date(),
      seenBy: [req.user._id]
    });
    await chat.save();

    const populated = await Chat.findById(chat._id)
      .populate('participants', 'username profilePic role _id')
      .lean();

    const io = req.app.get('io');
    if (io) {
      const messageData = {
        chatId: chat._id,
        sender: req.user._id,
        senderId: req.user._id.toString(),
        text: message,
        message: message,
        createdAt: new Date().toISOString(),
        from: req.user._id.toString()
      };

      io.to(req.user._id.toString()).emit('chat:message', messageData);
      io.to(recipientId.toString()).emit('chat:message', messageData);
    }

    const created = {
      senderId: req.user._id.toString(),
      recipientId: recipientId.toString(),
      text: message,
      timestamp: new Date().toISOString(),
    };
    return sendSuccess(res, { data: { chat: populated, created } });
  } catch (err) {
    console.error('Send message error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to send message' });
  }
});

router.patch('/chats/:chatId/read', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Chat not found' });
    }

    if (!chat.participants.map(String).includes(req.user._id.toString())) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized' });
    }

    
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user._id.toString() && !message.seenBy.includes(req.user._id)) {
        message.seenBy.push(req.user._id);
      }
    });

    await chat.save();
    return sendSuccess(res, { data: { message: 'Messages marked as read' } });
  } catch (err) {
    console.error('Mark read error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to mark messages as read' });
  }
});

router.delete('/chats/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Chat not found' });
    }


    if (!chat.participants.map(String).includes(req.user._id.toString())) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Not authorized' });
    }

    await Chat.deleteOne({ _id: req.params.chatId });
    return sendSuccess(res, { data: { message: 'Chat deleted' } });
  } catch (err) {
    console.error('Delete chat error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete chat' });
  }
});

export default router;
