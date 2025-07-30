const mongoose = require('mongoose');

const fishSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Fish type is required'],
    enum: {
      values: ['tilapia', 'omena', 'catfish', 'nileperch'],
      message: 'Fish type must be one of: tilapia, omena, catfish, nileperch'
    },
    lowercase: true,
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'Fish size is required'],
    min: [2, 'Fish size must be at least 2'],
    max: [8, 'Fish size cannot exceed 8'],
    validate: {
      validator: Number.isInteger,
      message: 'Fish size must be a whole number'
    }
  },
  pricePerKg: {
    type: Number,
    required: [true, 'Price per kg is required'],
    default: 800,
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: 'Price per kg must be greater than 0'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    default: 0,
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be a whole number'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(value);
      },
      message: 'Image must be a valid URL ending in jpg, jpeg, png, or webp'
    }
  },
  nutritionalInfo: {
    protein: {
      type: Number,
      min: 0,
      max: 100
    },
    fat: {
      type: Number,
      min: 0,
      max: 100
    },
    calories: {
      type: Number,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for type and size (common query pattern)
fishSchema.index({ type: 1, size: 1 });
fishSchema.index({ isActive: 1 });
fishSchema.index({ stock: 1 });
fishSchema.index({ featured: -1, createdAt: -1 });

// Virtual for availability status
fishSchema.virtual('isAvailable').get(function() {
  return this.isActive && this.stock > 0;
});

// Virtual for stock status
fishSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= 10) return 'low-stock';
  return 'in-stock';
});

// Static method to find available fish
fishSchema.statics.findAvailable = function(filters = {}) {
  return this.find({ 
    isActive: true, 
    stock: { $gt: 0 },
    ...filters 
  });
};

// Static method to find by type and size
fishSchema.statics.findByTypeAndSize = function(type, size) {
  return this.findOne({ 
    type: type.toLowerCase(), 
    size: size,
    isActive: true,
    stock: { $gt: 0 }
  });
};

// Method to update stock
fishSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
  } else if (operation === 'add') {
    this.stock += quantity;
  }
  return this.save();
};

// Method to check if quantity is available
fishSchema.methods.hasStock = function(requiredQuantity) {
  return this.stock >= requiredQuantity;
};

// Pre-save middleware to ensure data consistency
fishSchema.pre('save', function(next) {
  // Ensure stock is not negative
  if (this.stock < 0) {
    this.stock = 0;
  }
  
  // Format type to lowercase
  if (this.type) {
    this.type = this.type.toLowerCase();
  }
  
  next();
});

// Post-save middleware for logging
fishSchema.post('save', function(doc) {
  if (doc.stock === 0) {
    console.log(`Fish ${doc.type} size ${doc.size} is now out of stock`);
  }
});

module.exports = mongoose.model('Fish', fishSchema);