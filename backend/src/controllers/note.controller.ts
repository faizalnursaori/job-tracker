import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError, asyncHandler } from '../middlewares/error.middleware';

// Get notes for a job application
export const getApplicationNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobApplicationId } = req.params;
  const userId = req.user!.id;

  // Verify job application belongs to user
  const jobApplication = await prisma.jobApplication.findFirst({
    where: { id: jobApplicationId, userId }
  });

  if (!jobApplication) {
    throw createError('Job application not found', 404);
  }

  const notes = await prisma.applicationNote.findMany({
    where: { jobApplicationId },
    orderBy: { noteDate: 'desc' }
  });

  res.status(200).json({
    success: true,
    data: { notes }
  });
});

// Get single note
export const getNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const note = await prisma.applicationNote.findFirst({
    where: { 
      id,
      jobApplication: { userId }
    },
    include: {
      jobApplication: {
        select: {
          id: true,
          jobTitle: true,
          company: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!note) {
    throw createError('Note not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { note }
  });
});

// Create note
export const createNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobApplicationId } = req.params;
  const userId = req.user!.id;
  const { title, content, noteType, noteDate, isImportant = false } = req.body;

  // Verify job application belongs to user
  const jobApplication = await prisma.jobApplication.findFirst({
    where: { id: jobApplicationId, userId },
    include: { company: true }
  });

  if (!jobApplication) {
    throw createError('Job application not found', 404);
  }

  const note = await prisma.applicationNote.create({
    data: {
      jobApplicationId,
      title,
      content,
      noteType,
      noteDate: new Date(noteDate),
      isImportant
    }
  });

  // Create activity log
  await prisma.applicationActivity.create({
    data: {
      jobApplicationId,
      activity: 'Note added',
      description: `Added note: ${title}`,
      metadata: { 
        noteType,
        noteId: note.id
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: { note }
  });
});

// Update note
export const updateNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { title, content, noteType, noteDate, isImportant } = req.body;

  // Check if note exists and belongs to user
  const existingNote = await prisma.applicationNote.findFirst({
    where: { 
      id,
      jobApplication: { userId }
    }
  });

  if (!existingNote) {
    throw createError('Note not found', 404);
  }

  const updatedNote = await prisma.applicationNote.update({
    where: { id },
    data: {
      title,
      content,
      noteType,
      noteDate: noteDate ? new Date(noteDate) : undefined,
      isImportant
    }
  });

  res.status(200).json({
    success: true,
    message: 'Note updated successfully',
    data: { note: updatedNote }
  });
});

// Delete note
export const deleteNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if note exists and belongs to user
  const note = await prisma.applicationNote.findFirst({
    where: { 
      id,
      jobApplication: { userId }
    },
    include: {
      jobApplication: true
    }
  });

  if (!note) {
    throw createError('Note not found', 404);
  }

  await prisma.applicationNote.delete({
    where: { id }
  });

  // Create activity log
  await prisma.applicationActivity.create({
    data: {
      jobApplicationId: note.jobApplicationId,
      activity: 'Note deleted',
      description: `Deleted note: ${note.title}`,
      metadata: { 
        noteType: note.noteType
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Note deleted successfully'
  });
}); 