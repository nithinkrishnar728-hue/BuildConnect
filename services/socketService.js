import Conversation from '../models/Chat.js';

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Join user's room
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, userId, message, attachment } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const newMessage = {
          senderId: userId,
          content: message || '',
          attachment: attachment || null,
          createdAt: new Date()
        };

        conversation.messages.push(newMessage);
        conversation.lastMessage = message || '[Attachment]';
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSenderId = userId;
        await conversation.save();

        // Emit to all in conversation
        io.to(`conversation:${conversationId}`).emit('receive-message', {
          conversationId,
          message: newMessage
        });

        // Emit update to conversation list
        conversation.participantIds.forEach(participantId => {
          io.to(`user:${participantId}`).emit('conversation-updated', {
            conversationId,
            lastMessage: message
          });
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, userId, userName } = data;
      io.to(`conversation:${conversationId}`).emit('user-typing', {
        userId,
        userName
      });
    });

    socket.on('stop-typing', (data) => {
      const { conversationId, userId } = data;
      io.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
        userId
      });
    });

    // Online status
    socket.on('user-online', (userId) => {
      io.emit('user-status-changed', {
        userId,
        status: 'online'
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      io.emit('user-status-changed', {
        userId: socket.id,
        status: 'offline'
      });
    });
  });
};
