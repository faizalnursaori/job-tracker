import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/app';

describe('Authentication Routes', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email', validUserData.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'User already exists with this email');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    };

    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Invalid email or password');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('POST /api/auth/oauth/callback', () => {
    const oauthData = {
      email: 'oauth@example.com',
      firstName: 'OAuth',
      lastName: 'User',
      profileImage: 'https://example.com/avatar.jpg',
      provider: 'google',
      providerAccountId: 'google123456'
    };

    it('should create new user from OAuth provider', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/callback')
        .send(oauthData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OAuth authentication successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', oauthData.email);
      expect(response.body.data.user).toHaveProperty('profileImage', oauthData.profileImage);

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: oauthData.email },
        include: { accounts: true }
      });
      
      expect(user).toBeTruthy();
      expect(user?.accounts).toHaveLength(1);
      expect(user?.accounts[0].provider).toBe(oauthData.provider);
      expect(user?.accounts[0].providerAccountId).toBe(oauthData.providerAccountId);
    });

    it('should link OAuth account to existing user', async () => {
      // Create user with traditional registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: oauthData.email,
          password: 'password123',
          firstName: 'Existing',
          lastName: 'User'
        });

      const response = await request(app)
        .post('/api/auth/oauth/callback')
        .send(oauthData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('email', oauthData.email);

      // Verify account was linked
      const user = await prisma.user.findUnique({
        where: { email: oauthData.email },
        include: { accounts: true }
      });
      
      expect(user?.accounts).toHaveLength(1);
      expect(user?.accounts[0].provider).toBe(oauthData.provider);
    });

    it('should handle existing OAuth account', async () => {
      // Create user via OAuth first
      await request(app)
        .post('/api/auth/oauth/callback')
        .send(oauthData);

      // Try to authenticate again with same OAuth account
      const response = await request(app)
        .post('/api/auth/oauth/callback')
        .send(oauthData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('email', oauthData.email);

      // Should not create duplicate accounts
      const user = await prisma.user.findUnique({
        where: { email: oauthData.email },
        include: { accounts: true }
      });
      
      expect(user?.accounts).toHaveLength(1);
    });

    it('should return error for invalid provider', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/callback')
        .send({
          ...oauthData,
          provider: 'invalid-provider'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/callback')
        .send({
          email: oauthData.email
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login a user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'password123',
          firstName: 'Profile',
          lastName: 'User'
        });
      
      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', userId);
      expect(response.body.data.user).toHaveProperty('email', 'profile@example.com');
      expect(response.body.data.user).toHaveProperty('accounts');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should show OAuth accounts in profile', async () => {
      // Add OAuth account to user
      await request(app)
        .post('/api/auth/oauth/callback')
        .send({
          email: 'profile@example.com',
          firstName: 'Profile',
          lastName: 'User',
          provider: 'google',
          providerAccountId: 'google123'
        });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.user.accounts).toHaveLength(1);
      expect(response.body.data.user.accounts[0]).toHaveProperty('provider', 'google');
      expect(response.body.data.user.accounts[0]).toHaveProperty('type', 'oauth');
    });
  });
}); 