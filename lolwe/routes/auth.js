const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { securityLogger } = require('../middleware/logger');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('deliveryAddress')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Delivery address must be between 10 and 200 characters'),
  
  body('phone')
    .optional()
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// POST /api/auth/register
router.post('/register', registerValidation, catchAsync(async (req, res) => {
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

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    securityLogger('DUPLICATE_REGISTRATION_ATTEMPT', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
    deliveryAddress,
    phone,
    role: 'client' // Default role for registration
  });

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id, user.role);

  // Log successful registration
  console.log(`✅ New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deliveryAddress: user.deliveryAddress,
        phone: user.phone,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

// POST /api/auth/login
router.post('/login', loginValidation, catchAsync(async (req, res) => {
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

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !user.isActive) {
    securityLogger('FAILED_LOGIN_ATTEMPT', {
      email,
      reason: user ? 'Account deactivated' : 'User not found',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    securityLogger('FAILED_LOGIN_ATTEMPT', {
      email,
      reason: 'Invalid password',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken(user._id, user.role);

  // Log successful login
  console.log(`✅ User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deliveryAddress: user.deliveryAddress,
        phone: user.phone,
        lastLogin: user.lastLogin
      },
      token
    }
  });
}));

// POST /api/auth/verify-token (optional endpoint to verify token validity)
router.post('/verify-token', catchAsync(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found or inactive'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}));

module.exports = router;