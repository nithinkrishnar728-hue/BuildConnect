import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachment: String,
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  participantIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null
  },
  messages: [messageSchema],
  lastMessage: String,
  lastMessageAt: Date,
  lastMessageSenderId: mongoose.Schema.Types.ObjectId,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);
