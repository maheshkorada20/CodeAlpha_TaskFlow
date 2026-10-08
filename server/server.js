// const express = require('express');
// const http = require('http');
// const path = require('path');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const dotenv = require('dotenv');
// const { Server } = require('socket.io');

// // Load environment variables
// dotenv.config();

// const connectDB = require('./config/db');
// const { initSocket } = require('./services/socketService');
// const registerSocketHandlers = require('./sockets/socketHandlers');
// const { apiLimiter } = require('./middleware/rateLimitMiddleware');
// const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// // Route imports
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const projectRoutes = require('./routes/projectRoutes');
// const memberRoutes = require('./routes/memberRoutes');
// const invitationRoutes = require('./routes/invitationRoutes');
// const taskRoutes = require('./routes/taskRoutes');
// const commentRoutes = require('./routes/commentRoutes');
// const messageRoutes = require('./routes/messageRoutes');
// const attachmentRoutes = require('./routes/attachmentRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const activityRoutes = require('./routes/activityRoutes');
// const analyticsRoutes = require('./routes/analyticsRoutes');
// const adminRoutes = require('./routes/adminRoutes');

// // Connect Database
// connectDB();

// const app = express();
// const server = http.createServer(app);

// // Client origin
// const allowedOrigins = [
//   process.env.CLIENT_URL || 'http://localhost:5173',
//   'http://localhost:3000',
//   'http://127.0.0.1:5173',
// ];

// // Socket.IO Setup
// const io = new Server(server, {
//   cors: {
//     origin: (origin, callback) => {
//       // Allow requests with no origin (like mobile apps, curl) or matched origins
//       if (!origin || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(null, true); // Dev-friendly fallback
//     },
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
//     credentials: true,
//   },
// });

// // Initialize socket service and register handlers
// initSocket(io);
// registerSocketHandlers(io);

// // Security Middlewares
// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: 'cross-origin' },
//   })
// );

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//   })
// );

// // Body Parser & Logger
// app.use(express.json({ limit: '20mb' }));
// app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// if (process.env.NODE_ENV !== 'production') {
//   app.use(morgan('dev'));
// }

// // Static directory for uploaded files (Images, PDFs, documents)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // General API Rate Limiting
// app.use('/api', apiLimiter);

// // Health Check
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'online',
//     timestamp: new Date().toISOString(),
//     service: 'TaskFlow API Server',
//   });
// });

// // Mount Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/projects/:projectId/members', memberRoutes);
// app.use('/api/invitations', invitationRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/comments', commentRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/attachments', attachmentRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/activity', activityRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/admin', adminRoutes);

// // Error Handling Middlewares
// app.use(notFound);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`===============================================`);
//   console.log(`🚀 TaskFlow Server running in ${process.env.NODE_ENV || 'development'} mode`);
//   console.log(`📡 HTTP & Socket.IO Port: ${PORT}`);
//   console.log(`🔗 API Base: http://localhost:${PORT}/api`);
//   console.log(`===============================================`);
// });



const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const registerSocketHandlers = require('./sockets/socketHandlers');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const memberRoutes = require('./routes/memberRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityRoutes = require('./routes/activityRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Client origin
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or matched origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Initialize socket service and register handlers
initSocket(io);
registerSocketHandlers(io);

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body Parser & Logger
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static directory for uploaded files (Images, PDFs, documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General API Rate Limiting
app.use('/api', apiLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'TaskFlow API Server',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/members', memberRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client/dist');

  app.use(express.static(clientPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(
    `🚀 TaskFlow Server running in ${process.env.NODE_ENV || 'development'
    } mode`
  );
  console.log(`📡 HTTP & Socket.IO Port: ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});
