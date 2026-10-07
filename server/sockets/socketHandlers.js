const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');

// Map of online users: userId -> Set of socketIds
const onlineUsers = new Map();

const registerSocketHandlers = (io) => {
  // Socket JWT authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'taskflow_jwt_super_secret_key_2026_secure'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Track user socket connection
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Automatically join user's private notification room
    socket.join(`user:${userId}`);

    // Broadcast online status
    io.emit('user:status', { userId, status: 'online' });

    // Join Project Room with strict permission check
    socket.on('project:join', async (projectId) => {
      try {
        if (!projectId) return;

        // Verify project existence and membership
        const project = await Project.findById(projectId);
        if (!project) {
          return socket.emit('error', { message: 'Project not found' });
        }

        const isOwner = project.owner.toString() === userId;
        const isAdmin = socket.user.globalRole === 'admin';
        const member = await ProjectMember.findOne({ project: projectId, user: userId });

        if (!isOwner && !isAdmin && !member) {
          return socket.emit('error', { message: 'Unauthorized access to project room' });
        }

        const roomName = `project:${projectId}`;
        socket.join(roomName);

        // Notify room that user joined presence
        io.to(roomName).emit('project:member_active', {
          userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
        });
      } catch (err) {
        console.error('Error joining project socket room:', err.message);
      }
    });

    // Leave Project Room
    socket.on('project:leave', (projectId) => {
      if (projectId) {
        const roomName = `project:${projectId}`;
        socket.leave(roomName);
        io.to(roomName).emit('project:member_inactive', { userId });
      }
    });

    // Chat Typing Indicator
    socket.on('chat:typing', ({ projectId, isTyping }) => {
      if (projectId) {
        socket.to(`project:${projectId}`).emit('chat:user_typing', {
          userId,
          name: socket.user.name,
          isTyping,
        });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user:status', { userId, status: 'offline' });
        }
      }
    });
  });
};

module.exports = registerSocketHandlers;
