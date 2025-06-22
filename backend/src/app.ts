import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import jobApplicationRoutes from './routes/job-application.routes';
import companyRoutes from './routes/company.routes';
import statusRoutes from './routes/status.routes';
import noteRoutes from './routes/note.routes';
import userRoutes from './routes/user.routes';

// Import middleware
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';

// Initialize Prisma
export const prisma = new PrismaClient();

const app = express();

// Global Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app; 