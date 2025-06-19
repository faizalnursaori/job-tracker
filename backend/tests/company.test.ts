import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/app';

let companyId: string;

afterAll(async () => {
  // Cleanup
  await prisma.company.deleteMany({
    where: { name: { contains: 'Test' } }
  });
  await prisma.$disconnect();
});

describe('Companies API', () => {
  describe('POST /api/companies', () => {
    it('should create a new company', async () => {
      const companyData = {
        name: 'Test Tech Company',
        industry: 'Technology',
        website: 'https://testtech.com',
        location: 'San Francisco, CA',
        description: 'A test technology company',
        size: '51-200'
      };

      const response = await request(app)
        .post('/api/companies')
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company.name).toBe('Test Tech Company');
      expect(response.body.data.company.industry).toBe('Technology');

      companyId = response.body.data.company.id;
    });

    it('should not create duplicate company', async () => {
      const response = await request(app)
        .post('/api/companies')
        .send({
          name: 'Test Tech Company',
          industry: 'Technology'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Company already exists with this name');
    });

    it('should require company name', async () => {
      const response = await request(app)
        .post('/api/companies')
        .send({
          industry: 'Technology'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/companies', () => {
    it('should get all companies', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.companies)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/companies?page=1&limit=5')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/companies?search=Test')
        .expect(200);

      expect(response.body.data.companies.length).toBeGreaterThanOrEqual(1);
      const testCompany = response.body.data.companies.find((c: any) => 
        c.name.includes('Test')
      );
      expect(testCompany).toBeDefined();
    });
  });

  describe('GET /api/companies/suggestions', () => {
    it('should get company suggestions', async () => {
      const response = await request(app)
        .get('/api/companies/suggestions?q=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });

    it('should return empty for short query', async () => {
      const response = await request(app)
        .get('/api/companies/suggestions?q=T')
        .expect(200);

      expect(response.body.data.suggestions).toHaveLength(0);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should get single company', async () => {
      const response = await request(app)
        .get(`/api/companies/${companyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company.id).toBe(companyId);
      expect(response.body.data.company.name).toBe('Test Tech Company');
    });

    it('should return 404 for non-existent company', async () => {
      await request(app)
        .get('/api/companies/invalid-id')
        .expect(404);
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update company', async () => {
      const updateData = {
        name: 'Updated Test Tech Company',
        industry: 'Software',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/companies/${companyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company.name).toBe('Updated Test Tech Company');
      expect(response.body.data.company.industry).toBe('Software');
    });

    it('should return 404 for non-existent company', async () => {
      await request(app)
        .put('/api/companies/invalid-id')
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should delete company without job applications', async () => {
      // Create a company specifically for deletion
      const createResponse = await request(app)
        .post('/api/companies')
        .send({
          name: 'To Be Deleted Company',
          industry: 'Test'
        });

      const deleteCompanyId = createResponse.body.data.company.id;

      const response = await request(app)
        .delete(`/api/companies/${deleteCompanyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Company deleted successfully');

      // Verify it's deleted
      await request(app)
        .get(`/api/companies/${deleteCompanyId}`)
        .expect(404);
    });

    it('should return 404 for non-existent company', async () => {
      await request(app)
        .delete('/api/companies/invalid-id')
        .expect(404);
    });
  });
}); 