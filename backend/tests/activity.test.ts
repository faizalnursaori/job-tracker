import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/app';
import jwt from 'jsonwebtoken';

describe('Activity Endpoints', () => {
  let authToken: string;
  let userId: string;
  let companyId: string;
  let jobApplicationId: string;
  let activityId: string;

  beforeAll(async () => {
    // Clean up existing data
    await prisma.applicationActivity.deleteMany();
    await prisma.applicationNote.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-activity@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      }
    });

    userId = user.id;
    authToken = jwt.sign({ userId }, process.env.JWT_SECRET!);

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company for Activities',
        industry: 'Technology',
        website: 'https://testcompany.com'
      }
    });

    companyId = company.id;

    // Create test job application
    const jobApplication = await prisma.jobApplication.create({
      data: {
        userId,
        companyId,
        jobTitle: 'Software Engineer',
        status: 'APPLIED',
        appliedDate: new Date()
      }
    });

    jobApplicationId = jobApplication.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.applicationActivity.deleteMany();
    await prisma.applicationNote.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/activities', () => {
    it('should create a new activity successfully', async () => {
      const activityData = {
        jobApplicationId,
        activity: 'Status changed from APPLIED to PHONE_SCREEN',
        description: 'Received a call for phone screening interview',
        metadata: {
          previousStatus: 'APPLIED',
          newStatus: 'PHONE_SCREEN',
          scheduledDate: '2024-01-15'
        }
      };

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activity).toMatchObject({
        activity: activityData.activity,
        description: activityData.description,
        jobApplicationId
      });
      expect(response.body.data.activity.metadata).toEqual(activityData.metadata);

      activityId = response.body.data.activity.id;
    });

    it('should return 400 for invalid input data', async () => {
      const invalidData = {
        jobApplicationId,
        // Missing required activity field
        description: 'Some description'
      };

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input data');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent job application', async () => {
      const activityData = {
        jobApplicationId: 'non-existent-id',
        activity: 'Test activity',
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activityData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Job application not found or unauthorized');
    });

    it('should return 401 without authentication', async () => {
      const activityData = {
        jobApplicationId,
        activity: 'Test activity',
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/activities')
        .send(activityData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/activities', () => {
    beforeEach(async () => {
      // Create additional activities for testing
      await prisma.applicationActivity.createMany({
        data: [
          {
            jobApplicationId,
            activity: 'Application submitted',
            description: 'Initial application submission'
          },
          {
            jobApplicationId,
            activity: 'Resume reviewed',
            description: 'HR reviewed the resume'
          }
        ]
      });
    });

    it('should get all activities for authenticated user', async () => {
      const response = await request(app)
        .get('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activities).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.activities.length).toBeGreaterThan(0);
    });

    it('should filter activities by job application', async () => {
      const response = await request(app)
        .get(`/api/activities?jobApplicationId=${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activities).toBeInstanceOf(Array);
      response.body.data.activities.forEach((activity: any) => {
        expect(activity.jobApplicationId).toBe(jobApplicationId);
      });
    });

    it('should apply pagination correctly', async () => {
      const response = await request(app)
        .get('/api/activities?limit=1&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.offset).toBe(0);
      expect(response.body.data.activities.length).toBeLessThanOrEqual(1);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/activities?limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
    });
  });

  describe('GET /api/activities/:id', () => {
    it('should get a specific activity', async () => {
      const response = await request(app)
        .get(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activity.id).toBe(activityId);
      expect(response.body.data.activity.jobApplication).toBeDefined();
    });

    it('should return 404 for non-existent activity', async () => {
      const response = await request(app)
        .get('/api/activities/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Activity not found');
    });
  });

  describe('PUT /api/activities/:id', () => {
    it('should update an activity successfully', async () => {
      const updateData = {
        activity: 'Updated status change',
        description: 'Updated description with more details',
        metadata: {
          previousStatus: 'APPLIED',
          newStatus: 'INTERVIEW',
          updatedBy: 'system'
        }
      };

      const response = await request(app)
        .put(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activity.activity).toBe(updateData.activity);
      expect(response.body.data.activity.description).toBe(updateData.description);
      expect(response.body.data.activity.metadata).toEqual(updateData.metadata);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        activity: '', // Empty activity should be invalid
      };

      const response = await request(app)
        .put(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input data');
    });

    it('should return 404 for non-existent activity', async () => {
      const updateData = {
        activity: 'Updated activity'
      };

      const response = await request(app)
        .put('/api/activities/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Activity not found or unauthorized');
    });
  });

  describe('GET /api/activities/job-application/:jobApplicationId', () => {
    beforeEach(async () => {
      // Clean existing activities and create fresh ones
      await prisma.applicationActivity.deleteMany({
        where: { jobApplicationId }
      });

      await prisma.applicationActivity.createMany({
        data: [
          {
            jobApplicationId,
            activity: 'Application submitted',
            description: 'Initial submission'
          },
          {
            jobApplicationId,
            activity: 'Resume reviewed',
            description: 'HR review completed'
          },
          {
            jobApplicationId,
            activity: 'Phone screening scheduled',
            description: 'Interview scheduled for next week'
          }
        ]
      });
    });

    it('should get activities for specific job application', async () => {
      const response = await request(app)
        .get(`/api/activities/job-application/${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activities).toBeInstanceOf(Array);
      expect(response.body.data.activities.length).toBe(3);
      response.body.data.activities.forEach((activity: any) => {
        expect(activity.jobApplicationId).toBe(jobApplicationId);
      });
    });

    it('should apply pagination for job application activities', async () => {
      const response = await request(app)
        .get(`/api/activities/job-application/${jobApplicationId}?limit=2&offset=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activities.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.offset).toBe(1);
    });

    it('should return 404 for non-existent job application', async () => {
      const response = await request(app)
        .get('/api/activities/job-application/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Job application not found or unauthorized');
    });
  });

  describe('DELETE /api/activities/:id', () => {
    let activityToDeleteId: string;

    beforeEach(async () => {
      // Create a fresh activity for deletion test
      const activity = await prisma.applicationActivity.create({
        data: {
          jobApplicationId,
          activity: 'Activity to be deleted',
          description: 'This activity will be deleted in the test'
        }
      });
      activityToDeleteId = activity.id;
    });

    it('should delete an activity successfully', async () => {
      const response = await request(app)
        .delete(`/api/activities/${activityToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Activity deleted successfully');

      // Verify the activity is actually deleted
      const getResponse = await request(app)
        .get(`/api/activities/${activityToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('should return 404 for non-existent activity', async () => {
      const response = await request(app)
        .delete('/api/activities/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Activity not found or unauthorized');
    });
  });

  describe('Authorization checks', () => {
    let otherUserToken: string;
    let otherJobApplicationId: string;

    beforeAll(async () => {
      // Create another user and job application
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-user@example.com',
          passwordHash: 'hashedpassword',
          firstName: 'Other',
          lastName: 'User'
        }
      });

      otherUserToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET!);

      const otherJobApplication = await prisma.jobApplication.create({
        data: {
          userId: otherUser.id,
          companyId,
          jobTitle: 'Other Job',
          status: 'APPLIED',
          appliedDate: new Date()
        }
      });

      otherJobApplicationId = otherJobApplication.id;
    });

    it('should not allow access to other users activities', async () => {
      // Create activity as first user
      const activity = await prisma.applicationActivity.create({
        data: {
          jobApplicationId,
          activity: 'Private activity',
          description: 'This should not be accessible by other users'
        }
      });

      // Try to access with other user's token
      const response = await request(app)
        .get(`/api/activities/${activity.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not allow updating other users activities', async () => {
      const updateData = {
        activity: 'Unauthorized update attempt'
      };

      const response = await request(app)
        .put(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 