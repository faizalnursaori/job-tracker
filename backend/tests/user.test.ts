import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/app';

describe('User Profile API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up database
    await prisma.applicationActivity.deleteMany();
    await prisma.applicationNote.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.status.deleteMany();

    // Create test user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.applicationActivity.deleteMany();
    await prisma.applicationNote.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.status.deleteMany();
  });

  describe('GET /api/users/profile', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });
      expect(response.body.data.user).toHaveProperty('_count');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject(updateData);

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(updatedUser?.firstName).toBe('Updated');
      expect(updatedUser?.lastName).toBe('Name');
      expect(updatedUser?.phone).toBe('+1234567890');
    });

    it('should validate profile image URL', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Test',
          profileImage: 'invalid-url'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid profile image URL');
    });

    it('should allow partial updates', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'OnlyFirst'
        })
        .expect(200);

      expect(response.body.data.user.firstName).toBe('OnlyFirst');
      expect(response.body.data.user.lastName).toBe('User'); // Should remain unchanged
    });

    it('should require authentication', async () => {
      await request(app)
        .put('/api/users/profile')
        .send({ firstName: 'Test' })
        .expect(401);
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should reject incorrect current password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Current password is incorrect');
    });

    it('should validate new password length', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('New password must be at least 6 characters');
    });

    it('should reject same current and new password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('New password must be different from current password');
    });

    it('should require authentication', async () => {
      await request(app)
        .put('/api/users/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(401);
    });
  });

  describe('GET /api/users/stats', () => {
    beforeEach(async () => {
      // Create test company and status
      const company = await prisma.company.create({
        data: {
          name: 'Test Company',
          industry: 'Technology'
        }
      });

      const status = await prisma.status.create({
        data: {
          name: 'Applied',
          color: '#3B82F6',
          sortOrder: 1
        }
      });

      // Create test job applications
      await prisma.jobApplication.createMany({
        data: [
          {
            userId,
            companyId: company.id,
            statusId: status.id,
            jobTitle: 'Software Engineer',
            appliedDate: new Date()
          },
          {
            userId,
            companyId: company.id,
            statusId: status.id,
            jobTitle: 'Frontend Developer',
            appliedDate: new Date()
          }
        ]
      });
    });

    it('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalApplications', 2);
      expect(response.body.data).toHaveProperty('recentApplications');
      expect(response.body.data).toHaveProperty('statusBreakdown');
      expect(response.body.data.recentApplications).toHaveLength(2);
      expect(response.body.data.statusBreakdown).toHaveLength(1);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/stats')
        .expect(401);
    });
  });
}); 