import jwt from 'jsonwebtoken';

export default function registerSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.id) return next(new Error('Unauthorized'));
      socket.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (e) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(userId);

    socket.on('chat:send', ({ recipientId, message }) => {
      if (!recipientId || !message) return;
      io.to(recipientId).emit('chat:message', {
        from: userId,
        text: message,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('typing', ({ recipientId, isTyping }) => {
      if (!recipientId) return;
      io.to(recipientId).emit('typing', { from: userId, isTyping: !!isTyping });
    });

    socket.on('disconnect', () => {});
  });
}
