import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'Job Tracker API is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router; 