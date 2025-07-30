const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Fish = require('../models/Fish');
const { generateToken } = require('../middleware/auth');

describe('Fish Routes', () => {
  let clientToken, adminToken, adminUser, clientUser;

  beforeEach(async () => {
    // Create admin user
    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      deliveryAddress: 'Admin Address'
    });
    await adminUser.save();
    adminToken = generateToken(adminUser._id, adminUser.role);

    // Create client user
    clientUser = new User({
      name: 'Client User',
      email: 'client@example.com',
      password: 'Password123',
      role: 'client',
      deliveryAddress: '123 Client Street, Nairobi'
    });
    await clientUser.save();
    clientToken = generateToken(clientUser._id, clientUser.role);

    // Create sample fish
    await Fish.create([
      {
        type: 'tilapia',
        size: 4,
        pricePerKg: 800,
        stock: 50,
        description: 'Fresh tilapia from Lake Victoria'
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
        stock: 0,
        description: 'Large catfish - out of stock'
      }
    ]);
  });

  describe('GET /api/fish', () => {
    it('should get all active fish without authentication', async () => {
      const response = await request(app)
        .get('/api/fish')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fish).toHaveLength(3);
      expect(response.body.data.pagination).toHaveProperty('currentPage');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('totalItems');
    });

    it('should filter fish by type', async () => {
      const response = await request(app)
        .get('/api/fish?type=tilapia')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fish).toHaveLength(1);
      expect(response.body.data.fish[0].type).toBe('tilapia');
    });

    it('should filter fish by size', async () => {
      const response = await request(app)
        .get('/api/fish?size=4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fish).toHaveLength(1);
      expect(response.body.data.fish[0].size).toBe(4);
    });

    it('should filter fish by stock availability', async () => {
      const response = await request(app)
        .get('/api/fish?inStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fish).toHaveLength(2);
      response.body.data.fish.forEach(fish => {
        expect(fish.stock).toBeGreaterThan(0);
      });
    });

    it('should filter fish by price range', async () => {
      const response = await request(app)
        .get('/api/fish?minPrice=700&maxPrice=900')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fish).toHaveLength(1);
      expect(response.body.data.fish[0].pricePerKg).toBe(800);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/fish?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fish).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(2);
    });

    it('should include computed fields', async () => {
      const response = await request(app)
        .get('/api/fish')
        .expect(200);

      response.body.data.fish.forEach(fish => {
        expect(fish).toHaveProperty('isAvailable');
        expect(fish).toHaveProperty('stockStatus');
        
        if (fish.stock === 0) {
          expect(fish.isAvailable).toBe(false);
          expect(fish.stockStatus).toBe('out-of-stock');
        } else if (fish.stock <= 10) {
          expect(fish.stockStatus).toBe('low-stock');
        } else {
          expect(fish.stockStatus).toBe('in-stock');
        }
      });
    });

    it('should reject invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/fish?type=invalid&size=10')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
    });
  });

  describe('GET /api/fish/:id', () => {
    let fishId;

    beforeEach(async () => {
      const fish = await Fish.findOne({ type: 'tilapia' });
      fishId = fish._id;
    });

    it('should get specific fish by ID', async () => {
      const response = await request(app)
        .get(`/api/fish/${fishId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fish._id).toBe(fishId.toString());
      expect(response.body.data.fish.type).toBe('tilapia');
      expect(response.body.data.fish).toHaveProperty('isAvailable');
      expect(response.body.data.fish).toHaveProperty('stockStatus');
    });

    it('should return 404 for non-existent fish', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/fish/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Fish not found');
    });

    it('should return 404 for inactive fish', async () => {
      await Fish.findByIdAndUpdate(fishId, { isActive: false });

      const response = await request(app)
        .get(`/api/fish/${fishId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Fish not found');
    });
  });

  describe('POST /api/fish', () => {
    const validFishData = {
      type: 'nileperch',
      size: 8,
      pricePerKg: 1200,
      stock: 25,
      description: 'Large Nile perch'
    };

    it('should create new fish as admin', async () => {
      const response = await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFishData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fish added successfully');
      expect(response.body.data.fish.type).toBe(validFishData.type);
      expect(response.body.data.fish.size).toBe(validFishData.size);
    });

    it('should reject fish creation by client', async () => {
      const response = await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validFishData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required.');
    });

    it('should reject fish creation without authentication', async () => {
      const response = await request(app)
        .post('/api/fish')
        .send(validFishData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid fish type', async () => {
      const response = await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validFishData,
          type: 'salmon'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject invalid size', async () => {
      const response = await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validFishData,
          size: 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate fish (same type and size)', async () => {
      // Create first fish
      await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFishData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFishData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists in inventory');
    });

    it('should create fish with optional fields', async () => {
      const fishWithOptionalFields = {
        ...validFishData,
        image: 'https://example.com/fish.jpg',
        nutritionalInfo: {
          protein: 25,
          fat: 5,
          calories: 150
        }
      };

      const response = await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(fishWithOptionalFields)
        .expect(201);

      expect(response.body.data.fish.image).toBe(fishWithOptionalFields.image);
      expect(response.body.data.fish.nutritionalInfo).toEqual(fishWithOptionalFields.nutritionalInfo);
    });
  });

  describe('PUT /api/fish/:id', () => {
    let fishId;

    beforeEach(async () => {
      const fish = await Fish.findOne({ type: 'tilapia' });
      fishId = fish._id;
    });

    it('should update fish as admin', async () => {
      const updateData = {
        pricePerKg: 850,
        stock: 40,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/fish/${fishId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fish updated successfully');
      expect(response.body.data.fish.pricePerKg).toBe(updateData.pricePerKg);
      expect(response.body.data.fish.stock).toBe(updateData.stock);
    });

    it('should reject fish update by client', async () => {
      const response = await request(app)
        .put(`/api/fish/${fishId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ pricePerKg: 900 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject update of non-existent fish', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/fish/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pricePerKg: 900 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Fish not found');
    });

    it('should prevent duplicate when updating type/size', async () => {
      // Try to update tilapia to have same type/size as omena
      const response = await request(app)
        .put(`/api/fish/${fishId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'omena',
          size: 2
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists in inventory');
    });
  });

  describe('DELETE /api/fish/:id', () => {
    let fishId;

    beforeEach(async () => {
      const fish = await Fish.findOne({ type: 'tilapia' });
      fishId = fish._id;
    });

    it('should soft delete fish as admin', async () => {
      const response = await request(app)
        .delete(`/api/fish/${fishId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fish removed from inventory successfully');

      // Verify fish is soft deleted
      const fish = await Fish.findById(fishId);
      expect(fish.isActive).toBe(false);
    });

    it('should reject fish deletion by client', async () => {
      const response = await request(app)
        .delete(`/api/fish/${fishId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject deletion of non-existent fish', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/fish/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Fish not found');
    });
  });

  describe('GET /api/fish/types/summary', () => {
    it('should get fish types summary', async () => {
      const response = await request(app)
        .get('/api/fish/types/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeInstanceOf(Array);
      
      if (response.body.data.summary.length > 0) {
        const summary = response.body.data.summary[0];
        expect(summary).toHaveProperty('type');
        expect(summary).toHaveProperty('totalStock');
        expect(summary).toHaveProperty('avgPrice');
        expect(summary).toHaveProperty('minPrice');
        expect(summary).toHaveProperty('maxPrice');
        expect(summary).toHaveProperty('sizes');
        expect(summary).toHaveProperty('varietyCount');
        expect(summary).toHaveProperty('isAvailable');
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for admin endpoints', async () => {
      const response = await request(app)
        .post('/api/fish')
        .send({
          type: 'tilapia',
          size: 4,
          pricePerKg: 800,
          stock: 50
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGY0NzJkMTg4NzZjYzAwMTU4OTczZWYiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MjY2NjU2ODEsImV4cCI6MTYyNjY2NTY4Mn0.expired';

      const response = await request(app)
        .post('/api/fish')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          type: 'tilapia',
          size: 4,
          pricePerKg: 800,
          stock: 50
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});