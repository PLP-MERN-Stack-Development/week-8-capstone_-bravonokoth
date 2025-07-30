const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import custom modules
const connectDB = require('./config/db');
const { errorHandler, notFound, rateLimitHandler } = require('./middleware/errorHandler');
const { createLogger, performanceLogger, errorLogger } = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/auth');
const fishRoutes = require('./routes/fish');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');

// Create Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Configure Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true
  }
});

// Make io available in routes
app.set('io', io);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// Apply rate limiting to all routes
app.use(limiter);

// More strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(createLogger());
app.use(performanceLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/fish', fishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fish Delivery API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      fish: '/api/fish',
      orders: '/api/orders',
      users: '/api/users',
      health: '/health'
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user joining order room for real-time updates
  socket.on('join-order-room', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`👤 Socket ${socket.id} joined room: order-${orderId}`);
  });

  // Handle leaving order room
  socket.on('leave-order-room', (orderId) => {
    socket.leave(`order-${orderId}`);
    console.log(`👤 Socket ${socket.id} left room: order-${orderId}`);
  });

  // Handle admin joining admin room for notifications
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`👑 Admin socket ${socket.id} joined admin room`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Emit order status updates
const emitOrderUpdate = (orderId, orderData) => {
  io.to(`order-${orderId}`).emit('orderUpdate', orderData);
  console.log(`📡 Order update emitted for order: ${orderId}`);
};

// Emit new order notification to admins
const emitNewOrderNotification = (orderData) => {
  io.to('admin-room').emit('newOrder', orderData);
  console.log(`📡 New order notification emitted to admins`);
};

// Make socket functions available globally
global.emitOrderUpdate = emitOrderUpdate;
global.emitNewOrderNotification = emitNewOrderNotification;

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(notFound);
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🔗 Socket.io server ready for connections`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API endpoints: http://localhost:${PORT}/api`);
  }
});

module.exports = { app, server, io };