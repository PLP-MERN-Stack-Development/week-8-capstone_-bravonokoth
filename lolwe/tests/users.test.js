const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

describe('Users Routes', () => {
  let clientToken, adminToken, clientUser, adminUser;

  beforeEach(async () => {
    // Create client user
    clientUser = new User({
      name: 'John Client',
      email: 'client@example.com',
      password: 'Password123',
      role: 'client',
      deliveryAddress: '123 Client Street, Nairobi, Kenya',
      phone: '+254712345678'
    });
    await clientUser.save();
    clientToken = generateToken(clientUser._id, clientUser.role);

    // Create admin user
    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      deliveryAddress: 'Admin Office, Nairobi'
    });
    await adminUser.save();
    adminToken = generateToken(adminUser._id, adminUser.role);
  });

  describe('GET /api/users/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(clientUser._id.toString());
      expect(response.body.data.user.email).toBe(clientUser.email);
      expect(response.body.data.user.name).toBe(clientUser.name);
      expect(response.body.data.user.role).toBe(clientUser.role);
      expect(response.body.data.user.deliveryAddress).toBe(clientUser.deliveryAddress);
      expect(response.body.data.user.phone).toBe(clientUser.phone);
      expect(response.body.data.user).toHaveProperty('createdAt');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'John Updated',
        phone: '+254787654321',
        deliveryAddress: '456 New Street, Nairobi, Kenya'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.phone).toBe(updateData.phone);
      expect(response.body.data.user.deliveryAddress).toBe(updateData.deliveryAddress);
    });

    it('should update email successfully', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(updateData.email);
    });

    it('should update password successfully', async () => {
      const updateData = {
        password: 'NewPassword123'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify password was hashed and updated
      const updatedUser = await User.findById(clientUser._id).select('+password');
      const isNewPasswordValid = await bcrypt.compare(updateData.password, updatedUser.password);
      expect(isNewPasswordValid).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const updateData = {
        email: adminUser.email // Try to use admin's email
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email is already taken by another user');
    });

    it('should validate email format', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate password strength', async () => {
      const updateData = {
        password: 'weak'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate phone number format', async () => {
      const updateData = {
        phone: '123456789' // Invalid format
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should allow clearing phone number', async () => {
      const updateData = {
        phone: null
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phone).toBeNull();
    });

    it('should validate delivery address length', async () => {
      const updateData = {
        deliveryAddress: 'Short' // Too short
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to update profile including optional delivery address', async () => {
      const updateData = {
        name: 'Updated Admin',
        deliveryAddress: 'New Admin Office'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.deliveryAddress).toBe(updateData.deliveryAddress);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get own profile by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${clientUser._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(clientUser._id.toString());
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should allow admin to get any user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${clientUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(clientUser._id.toString());
    });

    it('should reject access to other user profile by client', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id/status', () => {
    it('should allow admin to activate/deactivate users', async () => {
      const response = await request(app)
        .put(`/api/users/${clientUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deactivated successfully');
      expect(response.body.data.user.isActive).toBe(false);

      // Verify in database
      const updatedUser = await User.findById(clientUser._id);
      expect(updatedUser.isActive).toBe(false);
    });

    it('should reject status change by client', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ isActive: false })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });

    it('should prevent admin from deactivating themselves', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You cannot deactivate your own account');
    });

    it('should validate isActive field', async () => {
      const response = await request(app)
        .put(`/api/users/${clientUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('isActive must be a boolean value');
    });
  });

  describe('DELETE /api/users/me', () => {
    it('should soft delete own account with correct password', async () => {
      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ password: 'Password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify user is deactivated
      const updatedUser = await User.findById(clientUser._id);
      expect(updatedUser.isActive).toBe(false);
    });

    it('should reject deletion with incorrect password', async () => {
      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ password: 'WrongPassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid password');
    });

    it('should reject deletion without password', async () => {
      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password is required to delete account');
    });
  });

  describe('GET /api/users/stats/summary', () => {
    beforeEach(async () => {
      // Create additional users for statistics
      await User.create([
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'Password123',
          role: 'client',
          deliveryAddress: 'Address 1',
          isActive: true
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'Password123',
          role: 'client',
          deliveryAddress: 'Address 2',
          isActive: false
        }
      ]);
    });

    it('should get user statistics as admin', async () => {
      const response = await request(app)
        .get('/api/users/stats/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('roleBreakdown');
      expect(response.body.data).toHaveProperty('registrationTrends');

      expect(response.body.data.summary).toHaveProperty('totalUsers');
      expect(response.body.data.summary).toHaveProperty('activeUsers');
      expect(response.body.data.summary).toHaveProperty('inactiveUsers');
      expect(response.body.data.summary.totalUsers).toBeGreaterThan(0);
    });

    it('should reject statistics access by client', async () => {
      const response = await request(app)
        .get('/api/users/stats/summary')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });

    it('should reject statistics access without authentication', async () => {
      const response = await request(app)
        .get('/api/users/stats/summary')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle deactivated user tokens', async () => {
      // Deactivate user
      await User.findByIdAndUpdate(clientUser._id, { isActive: false });

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account has been deactivated.');
    });

    it('should handle malformed authorization headers', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Malformed-Header')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', clientToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});