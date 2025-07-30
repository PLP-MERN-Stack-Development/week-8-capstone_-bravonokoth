const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

describe('Authentication Routes', () => {
  describe('POST /api/auth/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      deliveryAddress: '123 Main Street, Nairobi, Kenya'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.role).toBe('client');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should create user in database with hashed password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      const user = await User.findOne({ email: validUserData.email }).select('+password');
      expect(user).toBeTruthy();
      expect(user.password).not.toBe(validUserData.password);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Please provide a valid email address'
          })
        ])
      );
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password'
          })
        ])
      );
    });

    it('should reject registration with missing delivery address', async () => {
      const { deliveryAddress, ...userData } = validUserData;
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          name: 'Jane Doe'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should handle valid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          phone: '+254712345678'
        })
        .expect(201);

      expect(response.body.data.user.phone).toBe('+254712345678');
    });

    it('should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          phone: '123456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      deliveryAddress: '123 Main Street, Nairobi, Kenya'
    };

    beforeEach(async () => {
      // Create a user for testing login
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login user successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).toHaveProperty('lastLogin');
    });

    it('should update lastLogin timestamp', async () => {
      const loginTime = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const user = await User.findOne({ email: userData.email });
      expect(user.lastLogin).toBeInstanceOf(Date);
      expect(user.lastLogin.getTime()).toBeGreaterThanOrEqual(loginTime.getTime());
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject login for deactivated user', async () => {
      // Deactivate user
      await User.findOneAndUpdate(
        { email: userData.email },
        { isActive: false }
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should handle malformed email addresses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email-format',
          password: userData.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/verify-token', () => {
    let authToken;
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      deliveryAddress: '123 Main Street, Nairobi, Kenya'
    };

    beforeEach(async () => {
      // Register and get token
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      authToken = response.body.data.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: authToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token is valid');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token is required');
    });

    it('should reject token for deactivated user', async () => {
      // Deactivate user after getting token
      await User.findOneAndUpdate(
        { email: userData.email },
        { isActive: false }
      );

      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: authToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token is valid but user not found or inactive');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(6).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send(userData)
      );

      const responses = await Promise.all(promises);
      
      // First 5 should return 401 (unauthorized)
      responses.slice(0, 5).forEach(response => {
        expect(response.status).toBe(401);
      });

      // 6th request should be rate limited
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.message).toContain('Too many');
    }, 10000);
  });
});