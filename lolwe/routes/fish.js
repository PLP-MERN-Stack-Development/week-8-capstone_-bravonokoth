const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Fish = require('../models/Fish');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const fishValidation = [
  body('type')
    .isIn(['tilapia', 'omena', 'catfish', 'nileperch'])
    .withMessage('Fish type must be one of: tilapia, omena, catfish, nileperch'),
  
  body('size')
    .isInt({ min: 2, max: 8 })
    .withMessage('Fish size must be an integer between 2 and 8'),
  
  body('pricePerKg')
    .isFloat({ min: 0.01 })
    .withMessage('Price per kg must be a positive number'),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL')
];

const updateFishValidation = [
  body('type')
    .optional()
    .isIn(['tilapia', 'omena', 'catfish', 'nileperch'])
    .withMessage('Fish type must be one of: tilapia, omena, catfish, nileperch'),
  
  body('size')
    .optional()
    .isInt({ min: 2, max: 8 })
    .withMessage('Fish size must be an integer between 2 and 8'),
  
  body('pricePerKg')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price per kg must be a positive number'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL')
];

const queryValidation = [
  query('type')
    .optional()
    .isIn(['tilapia', 'omena', 'catfish', 'nileperch'])
    .withMessage('Fish type must be one of: tilapia, omena, catfish, nileperch'),
  
  query('size')
    .optional()
    .isInt({ min: 2, max: 8 })
    .withMessage('Fish size must be an integer between 2 and 8'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// GET /api/fish - Get all fish with filtering and pagination
router.get('/', optionalAuth, queryValidation, catchAsync(async (req, res) => {
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

  const { 
    type, 
    size, 
    minPrice, 
    maxPrice, 
    inStock,
    featured,
    page = 1, 
    limit = 10 
  } = req.query;

  // Build filter object
  const filter = { isActive: true };

  if (type) filter.type = type;
  if (size) filter.size = parseInt(size);
  if (minPrice || maxPrice) {
    filter.pricePerKg = {};
    if (minPrice) filter.pricePerKg.$gte = parseFloat(minPrice);
    if (maxPrice) filter.pricePerKg.$lte = parseFloat(maxPrice);
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (featured === 'true') filter.featured = true;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query with pagination
  const [fish, totalCount] = await Promise.all([
    Fish.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Fish.countDocuments(filter)
  ]);

  // Add computed fields
  const fishWithComputedFields = fish.map(item => ({
    ...item,
    isAvailable: item.stock > 0,
    stockStatus: item.stock === 0 ? 'out-of-stock' : 
                 item.stock <= 10 ? 'low-stock' : 'in-stock'
  }));

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      fish: fishWithComputedFields,
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

// GET /api/fish/:id - Get specific fish by ID
router.get('/:id', catchAsync(async (req, res) => {
  const fish = await Fish.findOne({ 
    _id: req.params.id, 
    isActive: true 
  });

  if (!fish) {
    throw new AppError('Fish not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      fish: {
        ...fish.toObject(),
        isAvailable: fish.stock > 0,
        stockStatus: fish.stock === 0 ? 'out-of-stock' : 
                     fish.stock <= 10 ? 'low-stock' : 'in-stock'
      }
    }
  });
}));

// POST /api/fish - Add new fish (Admin only)
router.post('/', authenticate, requireAdmin, fishValidation, catchAsync(async (req, res) => {
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

  const { type, size, pricePerKg, stock, description, image, nutritionalInfo } = req.body;

  // Check if fish with same type and size already exists
  const existingFish = await Fish.findOne({ type, size, isActive: true });
  if (existingFish) {
    return res.status(409).json({
      success: false,
      message: `${type} of size ${size} already exists in inventory`
    });
  }

  // Create new fish
  const fish = new Fish({
    type,
    size,
    pricePerKg,
    stock,
    description,
    image,
    nutritionalInfo
  });

  await fish.save();

  console.log(`✅ New fish added: ${type} size ${size} by admin ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Fish added successfully',
    data: { fish }
  });
}));

// PUT /api/fish/:id - Update fish (Admin only)
router.put('/:id', authenticate, requireAdmin, updateFishValidation, catchAsync(async (req, res) => {
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

  const fish = await Fish.findOne({ _id: req.params.id, isActive: true });
  
  if (!fish) {
    throw new AppError('Fish not found', 404);
  }

  // Check for duplicate if type or size is being changed
  if (req.body.type || req.body.size) {
    const newType = req.body.type || fish.type;
    const newSize = req.body.size || fish.size;
    
    if (newType !== fish.type || newSize !== fish.size) {
      const duplicate = await Fish.findOne({ 
        type: newType, 
        size: newSize, 
        isActive: true,
        _id: { $ne: fish._id }
      });
      
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `${newType} of size ${newSize} already exists in inventory`
        });
      }
    }
  }

  // Update fish
  Object.assign(fish, req.body);
  await fish.save();

  console.log(`✅ Fish updated: ${fish.type} size ${fish.size} by admin ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Fish updated successfully',
    data: { fish }
  });
}));

// DELETE /api/fish/:id - Soft delete fish (Admin only)
router.delete('/:id', authenticate, requireAdmin, catchAsync(async (req, res) => {
  const fish = await Fish.findOne({ _id: req.params.id, isActive: true });
  
  if (!fish) {
    throw new AppError('Fish not found', 404);
  }

  // Soft delete by setting isActive to false
  fish.isActive = false;
  await fish.save();

  console.log(`✅ Fish deleted: ${fish.type} size ${fish.size} by admin ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Fish removed from inventory successfully'
  });
}));

// GET /api/fish/types/summary - Get summary of fish types and their availability
router.get('/types/summary', catchAsync(async (req, res) => {
  const summary = await Fish.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$type',
        totalStock: { $sum: '$stock' },
        avgPrice: { $avg: '$pricePerKg' },
        minPrice: { $min: '$pricePerKg' },
        maxPrice: { $max: '$pricePerKg' },
        sizes: { $addToSet: '$size' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        type: '$_id',
        totalStock: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        minPrice: 1,
        maxPrice: 1,
        sizes: { $sortArray: { input: '$sizes', sortBy: 1 } },
        varietyCount: '$count',
        isAvailable: { $gt: ['$totalStock', 0] }
      }
    },
    { $sort: { type: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: { summary }
  });
}));

module.exports = router;