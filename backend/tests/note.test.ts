import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/app';
import jwt from 'jsonwebtoken';

describe('Note Endpoints', () => {
  let authToken: string;
  let userId: string;
  let companyId: string;
  let jobApplicationId: string;
  let noteId: string;

  beforeAll(async () => {
    // Clean up existing data
    await prisma.applicationNote.deleteMany();
    await prisma.applicationActivity.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-note@example.com',
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
        name: 'Test Company for Notes',
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
    await prisma.applicationNote.deleteMany();
    await prisma.applicationActivity.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/notes', () => {
    it('should create a new note successfully', async () => {
      const noteData = {
        jobApplicationId,
        title: 'Interview Preparation',
        content: 'Researched company background and prepared answers',
        noteType: 'INTERVIEW',
        noteDate: new Date().toISOString(),
        isImportant: true
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.note).toMatchObject({
        title: noteData.title,
        content: noteData.content,
        noteType: noteData.noteType,
        isImportant: noteData.isImportant
      });

      noteId = response.body.data.note.id;
    });

    it('should return 400 for invalid input data', async () => {
      const invalidData = {
        jobApplicationId,
        // Missing required title
        content: 'Some content',
        noteType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input data');
    });

    it('should return 404 for non-existent job application', async () => {
      const noteData = {
        jobApplicationId: 'non-existent-id',
        title: 'Test Note',
        content: 'Test content',
        noteType: 'OTHER',
        noteDate: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Job application not found or unauthorized');
    });

    it('should return 401 without authentication', async () => {
      const noteData = {
        jobApplicationId,
        title: 'Test Note',
        content: 'Test content',
        noteType: 'OTHER',
        noteDate: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/notes', () => {
    it('should get all notes for authenticated user', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter notes by job application', async () => {
      const response = await request(app)
        .get(`/api/notes?jobApplicationId=${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBeInstanceOf(Array);
      response.body.data.notes.forEach((note: any) => {
        expect(note.jobApplicationId).toBe(jobApplicationId);
      });
    });

    it('should apply pagination correctly', async () => {
      const response = await request(app)
        .get('/api/notes?limit=1&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.offset).toBe(0);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should get a specific note', async () => {
      const response = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(noteId);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found or unauthorized');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note successfully', async () => {
      const updateData = {
        title: 'Updated Interview Preparation',
        content: 'Updated content with more details',
        isImportant: false
      };

      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.content).toBe(updateData.content);
      expect(response.body.data.note.isImportant).toBe(updateData.isImportant);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        title: '', // Empty title should be invalid
        noteType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent note', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/notes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note successfully', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');

      // Verify the note is actually deleted
      const getResponse = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .delete('/api/notes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/notes/job-application/:jobApplicationId', () => {
    beforeEach(async () => {
      // Create a fresh note for this test
      await prisma.applicationNote.create({
        data: {
          jobApplicationId,
          title: 'Test Note for Job Application',
          content: 'Test content',
          noteType: 'OTHER',
          noteDate: new Date()
        }
      });
    });

    it('should get notes for specific job application', async () => {
      const response = await request(app)
        .get(`/api/notes/job-application/${jobApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBeInstanceOf(Array);
      response.body.data.notes.forEach((note: any) => {
        expect(note.jobApplicationId).toBe(jobApplicationId);
      });
    });

    it('should return 404 for non-existent job application', async () => {
      const response = await request(app)
        .get('/api/notes/job-application/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 