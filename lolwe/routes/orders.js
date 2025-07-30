const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Fish = require('../models/Fish');
const User = require('../models/User');
const { authenticate, requireAdmin, requireClient } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('items')
    .isArray({ min: 1, max: 10 })
    .withMessage('Order must have between 1 and 10 items'),
  
  body('items.*.fishId')
    .isMongoId()
    .withMessage('Fish ID must be a valid MongoDB ObjectId'),
  
  body('items.*.quantity')
    .isFloat({ min: 1 })
    .withMessage('Quantity must be at least 1 kg'),
  
  body('deliveryAddress')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Delivery address must be between 10 and 200 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const updateOrderValidation = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Status must be one of: pending, processing, shipped, delivered, cancelled'),
  
  body('adminNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters')
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Status must be one of: pending, processing, shipped, delivered, cancelled'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// POST /api/orders - Create new order (Clients only)
router.post('/', authenticate, requireClient, createOrderValidation, catchAsync(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }

  const { items, deliveryAddress, notes } = req.body;
  const userId = req.user._id;

  // Validate and prepare order items
  const orderItems = [];
  let totalPrice = 0;

  for (const item of items) {
    // Find fish and check availability
    const fish = await Fish.findById(item.fishId);
    
    if (!fish || !fish.isActive) {
      throw new AppError(`Fish with ID ${item.fishId} not found`, 404);
    }

    if (!fish.hasStock(item.quantity)) {
      throw new AppError(
        `Insufficient stock for ${fish.type} size ${fish.size}. Available: ${fish.stock}kg, Requested: ${item.quantity}kg`,
        400
      );
    }

    // Prepare order item
    const subtotal = item.quantity * fish.pricePerKg;
    orderItems.push({
      fishId: fish._id,
      fishType: fish.type,
      fishSize: fish.size,
      quantity: item.quantity,
      pricePerKg: fish.pricePerKg,
      subtotal
    });

    totalPrice += subtotal;
  }

  // Generate order number
  const orderNumber = await Order.generateOrderNumber();

  // Create order
  const order = new Order({
    userId,
    orderNumber,
    items: orderItems,
    totalPrice,
    deliveryAddress: deliveryAddress || req.user.deliveryAddress,
    notes
  });

  await order.save();

  // Update fish stock
  for (const item of items) {
    await Fish.findByIdAndUpdate(
      item.fishId,
      { $inc: { stock: -item.quantity } }
    );
  }

  // Populate order data for response
  await order.populate([
    { path: 'userId', select: 'name email' },
    { path: 'items.fishId', select: 'type size image' }
  ]);

  console.log(`✅ New order created: ${orderNumber} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
}));

// GET /api/orders - Get orders (user's own orders or all orders for admin)
router.get('/', authenticate, queryValidation, catchAsync(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }

  const { status, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  
  // Clients can only see their own orders
  if (req.user.role === 'client') {
    filter.userId = req.user._id;
  }

  // Execute query
  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email')
      .populate('items.fishId', 'type size image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    }
  });
}));

// GET /api/orders/:id - Get specific order
router.get('/:id', authenticate, catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('items.fishId', 'type size image description');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user can access this order
  if (req.user.role === 'client' && order.userId._id.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied. You can only view your own orders.', 403);
  }

  res.status(200).json({
    success: true,
    data: { order }
  });
}));

// PUT /api/orders/:id - Update order status (Admin only)
router.put('/:id', authenticate, requireAdmin, updateOrderValidation, catchAsync(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }

  const { status, adminNotes } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  try {
    // Use the model method to update status with validation
    await order.updateStatus(status, adminNotes);

    // Populate for response
    await order.populate([
      { path: 'userId', select: 'name email' },
      { path: 'items.fishId', select: 'type size' }
    ]);

    console.log(`✅ Order ${order.orderNumber} status updated to ${status} by admin ${req.user.email}`);

    // Emit real-time update (this will be handled by socket.io in server.js)
    req.app.get('io').to(`order-${order._id}`).emit('orderUpdate', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      updatedAt: order.updatedAt
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    if (error.message.includes('Cannot change status')) {
      throw new AppError(error.message, 400);
    }
    throw error;
  }
}));

// GET /api/orders/stats/summary - Get order statistics (Admin only)
router.get('/stats/summary', authenticate, requireAdmin, catchAsync(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        avgOrderValue: { $avg: '$totalPrice' }
      }
    }
  ]);

  const statusStats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const monthlyStats = await Order.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
      statusBreakdown: statusStats,
      monthlyTrends: monthlyStats
    }
  });
}));

// GET /api/orders/user/history - Get user's order history with analytics
router.get('/user/history', authenticate, requireClient, catchAsync(async (req, res) => {
  const userId = req.user._id;

  const [orders, stats] = await Promise.all([
    Order.find({ userId })
      .populate('items.fishId', 'type size')
      .sort({ createdAt: -1 })
      .limit(20),
    
    Order.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' }
        }
      }
    ])
  ]);

  const favoriteItems = await Order.aggregate([
    { $match: { userId } },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          fishType: '$items.fishType',
          fishSize: '$items.fishSize'
        },
        totalQuantity: { $sum: '$items.quantity' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      recentOrders: orders,
      statistics: stats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 },
      favoriteItems
    }
  });
}));

module.exports = router;