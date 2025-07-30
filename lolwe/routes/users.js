const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, requireOwnershipOrAdmin } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('deliveryAddress')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Delivery address must be between 10 and 200 characters'),
  
  body('phone')
    .optional()
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number')
];

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, catchAsync(async (req, res) => {
  // The user is already available from the authenticate middleware
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deliveryAddress: user.deliveryAddress,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// PUT /api/users/me - Update current user profile
router.put('/me', authenticate, updateProfileValidation, catchAsync(async (req, res) => {
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

  const { name, email, password, deliveryAddress, phone } = req.body;
  const userId = req.user._id;

  // Get the current user with password for comparison
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already taken by another user'
      });
    }
    user.email = email;
  }

  // Update other fields
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone; // Allow clearing phone
  
  // Handle deliveryAddress based on role
  if (user.role === 'client') {
    if (deliveryAddress) {
      user.deliveryAddress = deliveryAddress;
    }
  } else if (deliveryAddress !== undefined) {
    user.deliveryAddress = deliveryAddress; // Admin can set/clear delivery address
  }

  // Handle password change
  if (password) {
    // Password will be hashed by the pre-save middleware
    user.password = password;
  }

  // Save user (triggers pre-save middleware for password hashing)
  await user.save();

  console.log(`✅ User profile updated: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deliveryAddress: user.deliveryAddress,
        phone: user.phone,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// GET /api/users/:id - Get user by ID (Admin only or own profile)
router.get('/:id', authenticate, requireOwnershipOrAdmin((req) => req.params.id), catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deliveryAddress: user.deliveryAddress,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// PUT /api/users/:id/status - Activate/Deactivate user (Admin only)
router.put('/:id/status', authenticate, catchAsync(async (req, res) => {
  // Only admin can change user status
  if (req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const { isActive } = req.body;
  
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean value'
    });
  }

  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString() && !isActive) {
    return res.status(400).json({
      success: false,
      message: 'You cannot deactivate your own account'
    });
  }

  user.isActive = isActive;
  await user.save();

  console.log(`✅ User ${user.email} ${isActive ? 'activated' : 'deactivated'} by admin ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    }
  });
}));

// DELETE /api/users/me - Delete own account (soft delete)
router.delete('/me', authenticate, catchAsync(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required to delete account'
    });
  }

  // Get user with password for verification
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }

  // Soft delete by deactivating account
  user.isActive = false;
  await user.save();

  console.log(`✅ User account deleted: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

// GET /api/users/stats/summary - Get user statistics (Admin only)
router.get('/stats/summary', authenticate, catchAsync(async (req, res) => {
  // Only admin can view user statistics
  if (req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactiveUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        }
      }
    }
  ]);

  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const registrationTrends = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        registrations: { $sum: 1 }
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
      summary: stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 },
      roleBreakdown: roleStats,
      registrationTrends
    }
  });
}));

module.exports = router;