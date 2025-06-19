import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/app';

let authToken: string;
let userId: string;
let companyId: string;
let statusId: string;
let jobApplicationId: string;

beforeAll(async () => {
  // Register and login user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'jobtest@example.com',
      password: 'password123',
      firstName: 'Job',
      lastName: 'Tester'
    });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'jobtest@example.com',
      password: 'password123'
    });

  authToken = loginResponse.body.data.token;
  userId = loginResponse.body.data.user.id;

  // Create test company
  const companyResponse = await request(app)
    .post('/api/companies')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      name: 'Test Company',
      industry: 'Technology',
      location: 'San Francisco, CA'
    });

  companyId = companyResponse.body.data.company.id;

  // Get default status
  const statusResponse = await request(app)
    .get('/api/statuses')
    .set('Authorization', `Bearer ${authToken}`);

  statusId = statusResponse.body.data.statuses[0].id;
});

afterAll(async () => {
  // Cleanup
  await prisma.jobApplication.deleteMany({
    where: { userId }
  });
  await prisma.company.deleteMany({
    where: { name: 'Test Company' }
  });
  await prisma.user.deleteMany({
    where: { email: 'jobtest@example.com' }
  });
  await prisma.$disconnect();
});

describe('Job Applications API', () => {
  describe('POST /api/job-applications', () => {
    it('should create a new job application', async () => {
      const jobApplicationData = {
        companyId,
        statusId,
        jobTitle: 'Frontend Developer',
        jobLevel: 'MID',
        employmentType: 'FULL_TIME',
        salaryMin: 80000,
        salaryMax: 100000,
        location: 'Remote',
        isRemote: true,
        appliedDate: '2025-06-19T10:00:00.000Z',
        personalNotes: 'Looks like a good opportunity',
        priority: 2,
        source: 'Company Website'
      };

      const response = await request(app)
        .post('/api/job-applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobApplicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobApplication.jobTitle).toBe('Frontend Developer');
      expect(response.body.data.jobApplication.company.name).toBe('Test Company');

      jobApplicationId = response.body.data.jobApplication.id;
    });

    it('should return 404 for invalid company', async () => {
      const response = await request(app)
        .post('/api/job-applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: 'invalid-id',
          statusId,
          jobTitle: 'Test Job',
          appliedDate: '2025-06-19T10:00:00.000Z'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Company not found');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/job-applications')
        .send({
          companyId,
          statusId,
          jobTitle: 'Test Job',
          appliedDate: '2025-06-19T10:00:00.000Z'
        })
        .expect(401);
    });
  });

  describe('GET /api/job-applications', () => {
    it('should get all job applications for authenticated user', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].jobTitle).toBe('Frontend Developer');
      expect(response.body.data.pagination.total).toBe(1);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/job-applications?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/job-applications?search=Frontend')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/job-applications')
        .expect(401);
    });
  });

  describe('GET /api/job-applications/:id', () => {
    it('should get single job application', async () => {
      const response = await request(app)
        .get(`/api/job-applications/${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobApplication.id).toBe(jobApplicationId);
      expect(response.body.data.jobApplication.company).toBeDefined();
      expect(response.body.data.jobApplication.status).toBeDefined();
    });

    it('should return 404 for non-existent job application', async () => {
      await request(app)
        .get('/api/job-applications/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/job-applications/:id', () => {
    it('should update job application', async () => {
      const updateData = {
        jobTitle: 'Senior Frontend Developer',
        priority: 1,
        personalNotes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/job-applications/${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobApplication.jobTitle).toBe('Senior Frontend Developer');
      expect(response.body.data.jobApplication.priority).toBe(1);
    });

    it('should return 404 for non-existent job application', async () => {
      await request(app)
        .put('/api/job-applications/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobTitle: 'Updated Title' })
        .expect(404);
    });
  });

  describe('GET /api/job-applications/stats', () => {
    it('should get job application statistics', async () => {
      const response = await request(app)
        .get('/api/job-applications/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalApplications).toBe(1);
      expect(response.body.data.statusBreakdown).toHaveLength(1);
      expect(response.body.data.priorityBreakdown).toHaveLength(1);
      expect(response.body.data.recentActivity).toHaveLength(1);
    });
  });

  describe('DELETE /api/job-applications/:id', () => {
    it('should delete job application', async () => {
      const response = await request(app)
        .delete(`/api/job-applications/${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Job application deleted successfully');

      // Verify it's deleted
      await request(app)
        .get(`/api/job-applications/${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 