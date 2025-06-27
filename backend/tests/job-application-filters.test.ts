import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/app';

describe('Job Application Advanced Filters', () => {
  let authToken: string;
  let userId: string;
  let companyId: string;

  beforeAll(async () => {
    // Register and login user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'filtertest@example.com',
        password: 'password123',
        firstName: 'Filter',
        lastName: 'Tester'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'filtertest@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user.id;

    // Create test company
    const companyResponse = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Filter Test Company',
        industry: 'Technology',
        location: 'Jakarta'
      });

    companyId = companyResponse.body.data.company.id;
  });

  beforeEach(async () => {
    // Clean up existing job applications before each test
    await prisma.jobApplication.deleteMany({
      where: { userId }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.jobApplication.deleteMany({
      where: { userId }
    });
    await prisma.company.deleteMany({
      where: { name: 'Filter Test Company' }
    });
    await prisma.user.deleteMany({
      where: { email: 'filtertest@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/job-applications/filter-options', () => {
    beforeEach(async () => {
      // Create test application
      await request(app)
        .post('/api/job-applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId,
          jobTitle: 'Test Job',
          jobLevel: 'SENIOR',
          employmentType: 'FULL_TIME',
          status: 'APPLIED',
          location: 'Jakarta',
          source: 'LinkedIn',
          appliedDate: '2024-01-15T00:00:00.000Z'
        });
    });

    it('should return available filter options', async () => {
      const response = await request(app)
        .get('/api/job-applications/filter-options')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const { data } = response.body;
      expect(data).toHaveProperty('companies');
      expect(data).toHaveProperty('statuses');
      expect(data).toHaveProperty('jobLevels');
      expect(data).toHaveProperty('employmentTypes');
      expect(data).toHaveProperty('sources');
      expect(data).toHaveProperty('locations');
      expect(data).toHaveProperty('priorities');
      expect(data).toHaveProperty('currencies');
      expect(data).toHaveProperty('searchFields');

      expect(Array.isArray(data.companies)).toBe(true);
      expect(Array.isArray(data.statuses)).toBe(true);
      expect(Array.isArray(data.priorities)).toBe(true);
      expect(Array.isArray(data.currencies)).toBe(true);
      expect(Array.isArray(data.searchFields)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/job-applications/filter-options')
        .expect(401);
    });
  });

  describe('GET /api/job-applications with advanced filters', () => {
    beforeEach(async () => {
      // Create multiple test applications with different attributes
      const applications = [
        {
          companyId,
          jobTitle: 'Senior Frontend Developer',
          jobLevel: 'SENIOR',
          employmentType: 'FULL_TIME',
          status: 'APPLIED',
          salaryMin: 15000000,
          salaryMax: 20000000,
          location: 'Jakarta',
          isRemote: false,
          appliedDate: '2024-01-15T00:00:00.000Z',
          priority: 1,
          isFavorite: true,
          source: 'LinkedIn'
        },
        {
          companyId,
          jobTitle: 'Junior Backend Developer',
          jobLevel: 'ENTRY',
          employmentType: 'CONTRACT',
          status: 'PHONE_SCREEN',
          salaryMin: 8000000,
          salaryMax: 12000000,
          location: 'Bandung',
          isRemote: true,
          appliedDate: '2024-02-10T00:00:00.000Z',
          priority: 2,
          isFavorite: false,
          source: 'JobStreet'
        }
      ];

      for (const appData of applications) {
        await request(app)
          .post('/api/job-applications')
          .set('Authorization', `Bearer ${authToken}`)
          .send(appData);
      }
    });

    it('should filter by job level', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({ jobLevel: 'SENIOR' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].jobLevel).toBe('SENIOR');
    });

    it('should filter by employment type', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({ employmentType: 'CONTRACT' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].employmentType).toBe('CONTRACT');
    });

    it('should filter by remote work', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({ isRemote: 'true' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].isRemote).toBe(true);
    });

    it('should filter by favorites', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({ isFavorite: 'true' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].isFavorite).toBe(true);
    });

    it('should filter by location', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({ location: 'Jakarta' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].location).toContain('Jakarta');
    });

    it('should filter by source', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({ source: 'LinkedIn' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].source).toContain('LinkedIn');
    });

    it('should filter by salary range', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({
          salaryMin: 10000000,
          salaryMax: 15000000
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(1);
      expect(response.body.data.jobApplications[0].salaryMin).toBeGreaterThanOrEqual(8000000);
    });

    it('should sort by company name', async () => {
      const response = await request(app)
        .get('/api/job-applications')
        .query({
          sortBy: 'companyName',
          sortOrder: 'asc'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.jobApplications).toHaveLength(2);
    });
  });
}); 