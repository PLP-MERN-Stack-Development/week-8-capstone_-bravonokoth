const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Fish = require('../models/Fish');
const Order = require('../models/Order');
const { generateToken } = require('../middleware/auth');

describe('Orders Routes', () => {
  let clientToken, adminToken, clientUser, adminUser, fishIds;

  beforeEach(async () => {
    // Create users
    clientUser = new User({
      name: 'John Client',
      email: 'client@example.com',
      password: 'Password123',
      role: 'client',
      deliveryAddress: '123 Client Street, Nairobi, Kenya'
    });
    await clientUser.save();
    clientToken = generateToken(clientUser._id, clientUser.role);

    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      deliveryAddress: 'Admin Office'
    });
    await adminUser.save();
    adminToken = generateToken(adminUser._id, adminUser.role);

    // Create fish inventory
    const fishData = [
      {
        type: 'tilapia',
        size: 4,
        pricePerKg: 800,
        stock: 50,
        description: 'Fresh tilapia'
      },
      {
        type: 'omena',
        size: 2,
        pricePerKg: 600,
        stock: 30,
        description: 'Small dried fish'
      },
      {
        type: 'catfish',
        size: 6,
        pricePerKg: 1000,
        stock: 5,
        description: 'Large catfish'
      }
    ];

    const createdFish = await Fish.create(fishData);
    fishIds = createdFish.map(fish => fish._id);
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
      items: [
        {
          fishId: null, // Will be set in test
          quantity: 2
        }
      ],
      deliveryAddress: '456 New Street, Nairobi, Kenya',
      notes: 'Please call before delivery'
    };

    beforeEach(() => {
      validOrderData.items[0].fishId = fishIds[0]; // tilapia ID
    });

    it('should create order successfully for client', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validOrderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order created successfully');
      expect(response.body.data.order).toHaveProperty('orderNumber');
      expect(response.body.data.order.status).toBe('pending');
      expect(response.body.data.order.totalPrice).toBe(1600); // 2kg * 800
      expect(response.body.data.order.items).toHaveLength(1);
    });

    it('should update fish stock after order creation', async () => {
      const initialStock = await Fish.findById(fishIds[0]).select('stock');
      
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validOrderData)
        .expect(201);

      const updatedFish = await Fish.findById(fishIds[0]).select('stock');
      expect(updatedFish.stock).toBe(initialStock.stock - validOrderData.items[0].quantity);
    });

    it('should generate unique order number', async () => {
      const response1 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validOrderData)
        .expect(201);

      const response2 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validOrderData)
        .expect(201);

      expect(response1.body.data.order.orderNumber).not.toBe(response2.body.data.order.orderNumber);
      expect(response1.body.data.order.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
      expect(response2.body.data.order.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
    });

    it('should use user delivery address if not provided', async () => {
      const orderWithoutAddress = {
        items: validOrderData.items,
        notes: 'Test order'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderWithoutAddress)
        .expect(201);

      expect(response.body.data.order.deliveryAddress).toBe(clientUser.deliveryAddress);
    });

    it('should reject order with insufficient stock', async () => {
      const orderData = {
        items: [
          {
            fishId: fishIds[2], // catfish with stock 5
            quantity: 10 // requesting more than available
          }
        ],
        deliveryAddress: validOrderData.deliveryAddress
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
      expect(response.body.message).toContain('Available: 5');
      expect(response.body.message).toContain('Requested: 10');
    });

    it('should reject order with non-existent fish', async () => {
      const orderData = {
        items: [
          {
            fishId: '507f1f77bcf86cd799439011', // non-existent ID
            quantity: 2
          }
        ],
        deliveryAddress: validOrderData.deliveryAddress
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle multiple items in single order', async () => {
      const multiItemOrder = {
        items: [
          {
            fishId: fishIds[0], // tilapia
            quantity: 2
          },
          {
            fishId: fishIds[1], // omena
            quantity: 3
          }
        ],
        deliveryAddress: validOrderData.deliveryAddress
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(multiItemOrder)
        .expect(201);

      expect(response.body.data.order.items).toHaveLength(2);
      expect(response.body.data.order.totalPrice).toBe(3400); // (2*800) + (3*600)
    });

    it('should reject order without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate order items array', async () => {
      const invalidOrder = {
        items: [],
        deliveryAddress: validOrderData.deliveryAddress
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidOrder)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate quantity minimum', async () => {
      const invalidOrder = {
        items: [
          {
            fishId: fishIds[0],
            quantity: 0
          }
        ],
        deliveryAddress: validOrderData.deliveryAddress
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidOrder)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders', () => {
    let clientOrder1, clientOrder2, otherUserOrder;
    let otherClientUser, otherClientToken;

    beforeEach(async () => {
      // Create another client for testing isolation
      otherClientUser = new User({
        name: 'Other Client',
        email: 'other@example.com',
        password: 'Password123',
        role: 'client',
        deliveryAddress: '789 Other Street, Nairobi'
      });
      await otherClientUser.save();
      otherClientToken = generateToken(otherClientUser._id, otherClientUser.role);

      // Create orders for different users
      clientOrder1 = await Order.create({
        userId: clientUser._id,
        orderNumber: 'ORD-20231201-0001',
        items: [{
          fishId: fishIds[0],
          fishType: 'tilapia',
          fishSize: 4,
          quantity: 2,
          pricePerKg: 800,
          subtotal: 1600
        }],
        totalPrice: 1600,
        deliveryAddress: clientUser.deliveryAddress,
        status: 'pending'
      });

      clientOrder2 = await Order.create({
        userId: clientUser._id,
        orderNumber: 'ORD-20231201-0002',
        items: [{
          fishId: fishIds[1],
          fishType: 'omena',
          fishSize: 2,
          quantity: 3,
          pricePerKg: 600,
          subtotal: 1800
        }],
        totalPrice: 1800,
        deliveryAddress: clientUser.deliveryAddress,
        status: 'processing'
      });

      otherUserOrder = await Order.create({
        userId: otherClientUser._id,
        orderNumber: 'ORD-20231201-0003',
        items: [{
          fishId: fishIds[0],
          fishType: 'tilapia',
          fishSize: 4,
          quantity: 1,
          pricePerKg: 800,
          subtotal: 800
        }],
        totalPrice: 800,
        deliveryAddress: otherClientUser.deliveryAddress,
        status: 'shipped'
      });
    });

    it('should get client own orders only', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      
      const orderIds = response.body.data.orders.map(order => order._id);
      expect(orderIds).toContain(clientOrder1._id.toString());
      expect(orderIds).toContain(clientOrder2._id.toString());
      expect(orderIds).not.toContain(otherUserOrder._id.toString());
    });

    it('should get all orders as admin', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(3);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=processing')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('processing');
    });

    it('should paginate orders', async () => {
      const response = await request(app)
        .get('/api/orders?page=1&limit=1')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalItems).toBe(2);
    });

    it('should include populated user and fish data', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const order = response.body.data.orders[0];
      expect(order.userId).toHaveProperty('name');
      expect(order.userId).toHaveProperty('email');
      expect(order.items[0].fishId).toHaveProperty('type');
      expect(order.items[0].fishId).toHaveProperty('size');
    });
  });

  describe('GET /api/orders/:id', () => {
    let order;

    beforeEach(async () => {
      order = await Order.create({
        userId: clientUser._id,
        orderNumber: 'ORD-20231201-0001',
        items: [{
          fishId: fishIds[0],
          fishType: 'tilapia',
          fishSize: 4,
          quantity: 2,
          pricePerKg: 800,
          subtotal: 1600
        }],
        totalPrice: 1600,
        deliveryAddress: clientUser.deliveryAddress,
        status: 'pending'
      });
    });

    it('should get order by ID for owner', async () => {
      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order._id).toBe(order._id.toString());
      expect(response.body.data.order.userId).toHaveProperty('name');
      expect(response.body.data.order.items[0].fishId).toHaveProperty('type');
    });

    it('should get any order as admin', async () => {
      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order._id).toBe(order._id.toString());
    });

    it('should reject access to other user order', async () => {
      // Create another client
      const otherUser = new User({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123',
        role: 'client',
        deliveryAddress: '456 Other St'
      });
      await otherUser.save();
      const otherToken = generateToken(otherUser._id, otherUser.role);

      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });
  });

  describe('PUT /api/orders/:id', () => {
    let order;

    beforeEach(async () => {
      order = await Order.create({
        userId: clientUser._id,
        orderNumber: 'ORD-20231201-0001',
        items: [{
          fishId: fishIds[0],
          fishType: 'tilapia',
          fishSize: 4,
          quantity: 2,
          pricePerKg: 800,
          subtotal: 1600
        }],
        totalPrice: 1600,
        deliveryAddress: clientUser.deliveryAddress,
        status: 'pending'
      });
    });

    it('should update order status as admin', async () => {
      const response = await request(app)
        .put(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'processing',
          adminNotes: 'Order being prepared'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order status updated successfully');
      expect(response.body.data.order.status).toBe('processing');
      expect(response.body.data.order.adminNotes).toBe('Order being prepared');
    });

    it('should reject status update by client', async () => {
      const response = await request(app)
        .put(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'processing' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required.');
    });

    it('should validate status transitions', async () => {
      // Try to update directly from pending to delivered (invalid transition)
      const response = await request(app)
        .put(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot change status');
    });

    it('should allow valid status transitions', async () => {
      // pending -> processing
      await request(app)
        .put(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(200);

      // processing -> shipped
      await request(app)
        .put(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' })
        .expect(200);

      // shipped -> delivered
      const response = await request(app)
        .put(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(response.body.data.order.status).toBe('delivered');
      expect(response.body.data.order).toHaveProperty('actualDelivery');
    });

    it('should reject invalid status values', async () => {
      const response = await request(app)
        .put(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/orders/stats/summary', () => {
    beforeEach(async () => {
      // Create some orders for statistics
      await Order.create([
        {
          userId: clientUser._id,
          orderNumber: 'ORD-20231201-0001',
          items: [{ fishId: fishIds[0], fishType: 'tilapia', fishSize: 4, quantity: 2, pricePerKg: 800, subtotal: 1600 }],
          totalPrice: 1600,
          deliveryAddress: clientUser.deliveryAddress,
          status: 'pending'
        },
        {
          userId: clientUser._id,
          orderNumber: 'ORD-20231201-0002',
          items: [{ fishId: fishIds[1], fishType: 'omena', fishSize: 2, quantity: 3, pricePerKg: 600, subtotal: 1800 }],
          totalPrice: 1800,
          deliveryAddress: clientUser.deliveryAddress,
          status: 'delivered'
        }
      ]);
    });

    it('should get order statistics as admin', async () => {
      const response = await request(app)
        .get('/api/orders/stats/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('statusBreakdown');
      expect(response.body.data).toHaveProperty('monthlyTrends');
      
      expect(response.body.data.summary).toHaveProperty('totalOrders');
      expect(response.body.data.summary).toHaveProperty('totalRevenue');
      expect(response.body.data.summary).toHaveProperty('avgOrderValue');
    });

    it('should reject statistics access by client', async () => {
      const response = await request(app)
        .get('/api/orders/stats/summary')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required.');
    });
  });

  describe('GET /api/orders/user/history', () => {
    beforeEach(async () => {
      // Create order history for client
      await Order.create([
        {
          userId: clientUser._id,
          orderNumber: 'ORD-20231201-0001',
          items: [{ fishId: fishIds[0], fishType: 'tilapia', fishSize: 4, quantity: 2, pricePerKg: 800, subtotal: 1600 }],
          totalPrice: 1600,
          deliveryAddress: clientUser.deliveryAddress,
          status: 'delivered'
        },
        {
          userId: clientUser._id,
          orderNumber: 'ORD-20231201-0002',
          items: [{ fishId: fishIds[0], fishType: 'tilapia', fishSize: 4, quantity: 1, pricePerKg: 800, subtotal: 800 }],
          totalPrice: 800,
          deliveryAddress: clientUser.deliveryAddress,
          status: 'pending'
        }
      ]);
    });

    it('should get user order history and statistics', async () => {
      const response = await request(app)
        .get('/api/orders/user/history')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recentOrders');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('favoriteItems');
      
      expect(response.body.data.recentOrders).toHaveLength(2);
      expect(response.body.data.statistics.totalOrders).toBe(2);
      expect(response.body.data.statistics.totalSpent).toBe(2400);
    });

    it('should reject history access by admin without proper endpoint', async () => {
      const response = await request(app)
        .get('/api/orders/user/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Client or admin access required.');
    });
  });
});