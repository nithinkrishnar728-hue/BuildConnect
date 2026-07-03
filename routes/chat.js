import express from 'express';
import Conversation from '../models/Chat.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get or create conversation
router.post('/conversations', protect, asyncHandler(async (req, res) => {
  const { otherUserId, requestId } = req.body;

  if (!otherUserId) {
    throw new AppError('Other user ID is required', 400);
  }

  let conversation = await Conversation.findOne({
    participantIds: { $all: [req.user._id, otherUserId] }
  }).populate('participantIds', 'firstName lastName profileImage');

  if (!conversation) {
    conversation = await Conversation.create({
      participantIds: [req.user._id, otherUserId],
      requestId: requestId || null
    });
    conversation = await conversation.populate('participantIds', 'firstName lastName profileImage');
  }

  res.status(200).json({
    success: true,
    conversation
  });
}));

// Get all conversations for user
router.get('/conversations', protect, asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participantIds: req.user._id,
    isActive: true
  })
    .populate('participantIds', 'firstName lastName profileImage')
    .populate('lastMessageSenderId', 'firstName lastName')
    .sort({ lastMessageAt: -1 });

  // Attach unread count per conversation
  const withUnread = conversations.map(conv => {
    const unread = conv.messages.filter(
      m => m.senderId.toString() !== req.user._id.toString() && !m.readAt
    ).length;
    const obj = conv.toObject();
    obj.unreadCount = unread;
    return obj;
  });

  res.status(200).json({
    success: true,
    count: withUnread.length,
    conversations: withUnread
  });
}));


// Get single conversation with messages
router.get('/conversations/:id', protect, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate('participantIds', 'firstName lastName profileImage')
    .populate('messages.senderId', 'firstName lastName profileImage');

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  if (!conversation.participantIds.some(id => id._id.toString() === req.user._id.toString())) {
    throw new AppError('Not authorized to view this conversation', 403);
  }

  // Mark messages as read
  conversation.messages.forEach(msg => {
    if (msg.senderId._id.toString() !== req.user._id.toString() && !msg.readAt) {
      msg.readAt = new Date();
    }
  });
  await conversation.save();

  res.status(200).json({
    success: true,
    conversation
  });
}));

// Send message
router.post('/conversations/:id/messages', protect, asyncHandler(async (req, res) => {
  const { content, attachment } = req.body;

  if (!content && !attachment) {
    throw new AppError('Message content or attachment is required', 400);
  }

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  if (!conversation.participantIds.some(id => id.toString() === req.user._id.toString())) {
    throw new AppError('Not authorized to send messages in this conversation', 403);
  }

  const message = {
    senderId: req.user._id,
    content: content || '',
    attachment: attachment || null,
    createdAt: new Date()
  };

  conversation.messages.push(message);
  conversation.lastMessage = content || '[Attachment]';
  conversation.lastMessageAt = new Date();
  conversation.lastMessageSenderId = req.user._id;

  await conversation.save();

  const updatedConversation = await conversation.populate('messages.senderId', 'firstName lastName profileImage');

  res.status(201).json({
    success: true,
    message: updatedConversation.messages[updatedConversation.messages.length - 1]
  });
}));

export default router;
