import { Request, Response } from 'express';
import { prisma } from '../app';
import { createError, asyncHandler } from '../middlewares/error.middleware';

// Get all companies
export const getCompanies = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = '1', 
    limit = '50', 
    search,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { industry: { contains: search as string } },
      { location: { contains: search as string } }
    ];
  }

  // Get total count and data
  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            jobApplications: true
          }
        }
      },
      orderBy: {
        [sortBy as string]: sortOrder
      },
      skip,
      take: Number(limit)
    })
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  res.status(200).json({
    success: true,
    data: {
      companies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: totalPages
      }
    }
  });
});

// Get single company
export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      jobApplications: {
        select: {
          id: true,
          jobTitle: true,
          status: {
            select: {
              name: true,
              color: true
            }
          },
          appliedDate: true,
          priority: true
        },
        orderBy: { appliedDate: 'desc' },
        take: 10
      },
      _count: {
        select: {
          jobApplications: true
        }
      }
    }
  });

  if (!company) {
    throw createError('Company not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { company }
  });
});

// Create company
export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  const { name, industry, website, location, description, logoUrl, size } = req.body;

  if (!name) {
    throw createError('Company name is required', 400);
  }

  // Check if company already exists
  const existingCompany = await prisma.company.findUnique({
    where: { name }
  });

  if (existingCompany) {
    throw createError('Company already exists with this name', 400);
  }

  const company = await prisma.company.create({
    data: {
      name,
      industry,
      website,
      location,
      description,
      logoUrl,
      size
    }
  });

  res.status(201).json({
    success: true,
    message: 'Company created successfully',
    data: { company }
  });
});

// Update company
export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, industry, website, location, description, logoUrl, size } = req.body;

  // Check if company exists
  const existingCompany = await prisma.company.findUnique({
    where: { id }
  });

  if (!existingCompany) {
    throw createError('Company not found', 404);
  }

  // Check if name is already taken by another company
  if (name && name !== existingCompany.name) {
    const nameExists = await prisma.company.findUnique({
      where: { name }
    });
    
    if (nameExists) {
      throw createError('Company name already exists', 400);
    }
  }

  const updatedCompany = await prisma.company.update({
    where: { id },
    data: {
      name,
      industry,
      website,
      location,
      description,
      logoUrl,
      size
    }
  });

  res.status(200).json({
    success: true,
    message: 'Company updated successfully',
    data: { company: updatedCompany }
  });
});

// Delete company
export const deleteCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          jobApplications: true
        }
      }
    }
  });

  if (!company) {
    throw createError('Company not found', 404);
  }

  // Check if company has job applications
  if (company._count.jobApplications > 0) {
    throw createError('Cannot delete company with existing job applications', 400);
  }

  await prisma.company.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Company deleted successfully'
  });
});

// Get company suggestions (for autocomplete)
export const getCompanySuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || (q as string).length < 2) {
    return res.status(200).json({
      success: true,
      data: { suggestions: [] }
    });
  }

  const suggestions = await prisma.company.findMany({
    where: {
      name: {
        contains: q as string
      }
    },
    select: {
      id: true,
      name: true,
      industry: true,
      logoUrl: true
    },
    orderBy: { name: 'asc' },
    take: 10
  });

  res.status(200).json({
    success: true,
    data: { suggestions }
  });
}); 