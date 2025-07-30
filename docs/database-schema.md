# Database Schema Documentation

## MongoDB Collections for Fish Supply & Delivery Platform

---

## 1. Users Collection

### Schema Structure
```javascript
{
  _id: ObjectId,
  email: String, // required, unique, lowercase
  password: String, // required, hashed with bcrypt
  role: String, // enum: ['client', 'admin'], default: 'client'
  name: String, // required, trim whitespace
  deliveryAddress: String, // required for clients, optional for admin
  phone: String, // optional, for delivery contact
  isActive: Boolean, // default: true, for soft deletion
  lastLogin: Date, // track user activity
  createdAt: Date, // default: Date.now
  updatedAt: Date // auto-updated on save
}
```

### Validation Rules
- **Email**: Valid email format, unique across collection
- **Password**: Minimum 6 characters, hashed with bcrypt (salt rounds: 12)
- **Role**: Only 'client' or 'admin' allowed
- **Name**: 2-50 characters, required
- **DeliveryAddress**: Required for clients, max 200 characters

### Indexes
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ createdAt: -1 })
```

---

## 2. Fish Collection

### Schema Structure
```javascript
{
  _id: ObjectId,
  type: String, // enum: ['tilapia', 'omena', 'catfish', 'nileperch']
  size: Number, // min: 2, max: 8 (fish size classification)
  pricePerKg: Number, // default: 800, in KSh
  stock: Number, // available quantity in kg, min: 0
  description: String, // optional, fish details
  image: String, // optional, image URL
  nutritionalInfo: Object, // optional, nutritional data
  isActive: Boolean, // default: true, for inventory management
  createdAt: Date, // default: Date.now
  updatedAt: Date // auto-updated on save
}
```

### Validation Rules
- **Type**: Only predefined fish types allowed
- **Size**: Integer between 2-8 inclusive
- **PricePerKg**: Positive number, default 800 KSh
- **Stock**: Non-negative integer
- **Description**: Max 500 characters

### Indexes
```javascript
db.fish.createIndex({ type: 1, size: 1 })
db.fish.createIndex({ isActive: 1 })
db.fish.createIndex({ stock: 1 })
```

---

## 3. Orders Collection

### Schema Structure
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: 'User', required
  orderNumber: String, // unique, auto-generated (ORD-YYYYMMDD-XXXX)
  items: [
    {
      fishId: ObjectId, // ref: 'Fish', required
      fishType: String, // denormalized for history
      fishSize: Number, // denormalized for history
      quantity: Number, // in kg, min: 1
      pricePerKg: Number, // price at time of order
      subtotal: Number // quantity * pricePerKg
    }
  ],
  totalPrice: Number, // sum of all subtotals
  deliveryAddress: String, // copied from user at order time
  deliveryFee: Number, // default: 100 KSh
  status: String, // enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  paymentStatus: String, // enum: ['pending', 'paid', 'failed'], default: 'pending'
  estimatedDelivery: Date, // calculated based on location
  actualDelivery: Date, // when delivered
  notes: String, // optional, special instructions
  createdAt: Date, // default: Date.now
  updatedAt: Date // auto-updated on save
}
```

### Validation Rules
- **UserId**: Must reference existing user
- **Items**: At least 1 item required, max 10 items per order
- **Quantity**: Minimum 1 kg per item
- **Status**: Only predefined statuses allowed
- **TotalPrice**: Must match calculated sum

### Indexes
```javascript
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ createdAt: -1 })
```

---

## 4. Order History Collection (Optional)

### Schema Structure
```javascript
{
  _id: ObjectId,
  orderId: ObjectId, // ref: 'Order'
  status: String, // status at this point in time
  timestamp: Date, // when status changed
  updatedBy: ObjectId, // ref: 'User' (admin who updated)
  notes: String // optional, reason for change
}
```

---

## Relationships

### One-to-Many Relationships
- **User → Orders**: One user can have multiple orders
- **Fish → Order Items**: One fish type can appear in multiple orders

### Data Integrity
- **Foreign Key Constraints**: Enforced at application level
- **Cascading Rules**: Orders retain fish info even if fish deleted
- **Soft Deletion**: Users and fish marked inactive instead of deleted

---

## Performance Considerations

### Query Optimization
- Index frequently queried fields
- Use aggregation pipeline for complex reports
- Implement pagination for large result sets

### Data Archiving
- Archive old orders (> 1 year) to separate collection
- Compress historical data for storage efficiency

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Replica set for high availability