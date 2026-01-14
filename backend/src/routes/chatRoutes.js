import express from 'express';
import httpStatus from 'http-status';
import Chat from '../models/Chat.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// GET /api/chats
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

// POST /api/chats/send
router.post('/chats/send', authMiddleware, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'recipientId and message required' });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, recipientId], $size: 2 },
      isGroup: false,
    });

    if (!chat) {
      chat = await Chat.create({ 
        participants: [req.user._id, recipientId], 
        messages: [],
        isGroup: false
      });
    }

    chat.messages.push({ 
      sender: req.user._id, 
      text: message,
      createdAt: new Date()
    });
    await chat.save();

    const populated = await Chat.findById(chat._id)
      .populate('participants', 'username profilePic role _id')
      .lean();

    // emit via socket to both users
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
      message,
      timestamp: new Date().toISOString(),
    };
    return sendSuccess(res, { data: { chat: populated, created } });
  } catch (err) {
    console.error('Send message error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to send message' });
  }
});

// DELETE /api/chats/:chatId (delete entire chat)
router.delete('/chats/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return sendError(res, { status: httpStatus.NOT_FOUND, message: 'Chat not found' });
    }

    // Check if user is participant
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
