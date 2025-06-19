import request from 'supertest';
import app from '../src/app';

describe('Health Routes', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Job Tracker API is healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('database', 'connected');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Route /api/nonexistent not found');
    });
  });
}); 