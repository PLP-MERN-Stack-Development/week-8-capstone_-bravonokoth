const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  fishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fish',
    required: [true, 'Fish ID is required']
  },
  fishType: {
    type: String,
    required: [true, 'Fish type is required'],
    enum: ['tilapia', 'omena', 'catfish', 'nileperch']
  },
  fishSize: {
    type: Number,
    required: [true, 'Fish size is required'],
    min: 2,
    max: 8
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1 kg'],
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: 'Quantity must be greater than 0'
    }
  },
  pricePerKg: {
    type: Number,
    required: [true, 'Price per kg is required'],
    min: [0, 'Price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required']
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items) {
        return items && items.length > 0 && items.length <= 10;
      },
      message: 'Order must have between 1 and 10 items'
    }
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true,
    maxlength: [200, 'Delivery address cannot exceed 200 characters']
  },
  deliveryFee: {
    type: Number,
    default: 100,
    min: [0, 'Delivery fee cannot be negative']
  },
  status: {
    type: String,
    required: [true, 'Order status is required'],
    enum: {
      values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      message: 'Status must be one of: pending, processing, shipped, delivered, cancelled'
    },
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed'],
      message: 'Payment status must be one of: pending, paid, failed'
    },
    default: 'pending'
  },
  estimatedDelivery: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Estimated delivery date must be in the future'
    }
  },
  actualDelivery: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date >= this.createdAt;
      },
      message: 'Actual delivery date cannot be before order creation'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.fishId': 1 });

// Virtual for grand total (including delivery fee)
orderSchema.virtual('grandTotal').get(function() {
  return this.totalPrice + this.deliveryFee;
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the last order of today
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^ORD-${dateStr}-`)
  }).sort({ orderNumber: -1 });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('userId', 'name email');
};

// Static method to find user orders
orderSchema.statics.findUserOrders = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  return query.sort({ createdAt: -1 }).populate('items.fishId', 'type size');
};

// Method to calculate total from items
orderSchema.methods.calculateTotal = function() {
  this.totalPrice = this.items.reduce((total, item) => {
    item.subtotal = item.quantity * item.pricePerKg;
    return total + item.subtotal;
  }, 0);
  
  return this.totalPrice;
};

// Method to update status with validation
orderSchema.methods.updateStatus = function(newStatus, adminNotes = '') {
  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot change status from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  if (adminNotes) {
    this.adminNotes = adminNotes;
  }
  
  if (newStatus === 'delivered') {
    this.actualDelivery = new Date();
  }
  
  return this.save();
};

// Pre-save middleware to validate and calculate totals
orderSchema.pre('save', function(next) {
  // Auto-generate order number if not present
  if (this.isNew && !this.orderNumber) {
    this.constructor.generateOrderNumber().then(orderNumber => {
      this.orderNumber = orderNumber;
      next();
    }).catch(next);
    return;
  }
  
  // Calculate subtotals and validate total
  if (this.isModified('items')) {
    this.calculateTotal();
  }
  
  // Set estimated delivery (3 days from now for new orders)
  if (this.isNew && !this.estimatedDelivery) {
    this.estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Post-save middleware for logging
orderSchema.post('save', function(doc) {
  if (doc.isModified('status')) {
    console.log(`Order ${doc.orderNumber} status updated to ${doc.status}`);
  }
});

module.exports = mongoose.model('Order', orderSchema);