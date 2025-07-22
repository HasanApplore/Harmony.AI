import { Request, Response } from 'express';
import { Express } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { insertCompanySchema } from '@shared/schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isAuthenticated } from './auth';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'company-logo-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

export function setupCompanyRoutes(app: Express) {
  // Get all companies
  app.get('/api/companies', async (req: Request, res: Response) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  });

  // Get a specific company by ID
  app.get('/api/companies/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  });

  // Create a new company
  app.post('/api/companies', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCompanySchema.parse({
        ...req.body,
        ownerId: req.user!.id
      });
      
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating company:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  });

  // Update a company
  app.patch('/api/companies/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      if (company.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized: You do not own this company' });
      }
      
      const updatedCompany = await storage.updateCompany(id, req.body);
      res.json(updatedCompany);
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  });

  // Delete a company
  app.delete('/api/companies/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      if (company.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized: You do not own this company' });
      }
      
      await storage.deleteCompany(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({ error: 'Failed to delete company' });
    }
  });

  // Upload company logo
  app.post('/api/companies/:id/logo', isAuthenticated, upload.single('logo'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      if (company.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized: You do not own this company' });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Get the URL for the uploaded file
      const logoUrl = `/uploads/${req.file.filename}`;
      
      // Update the company with the logo URL
      const updatedCompany = await storage.updateCompany(id, { logoUrl });
      
      res.json({ logoUrl, company: updatedCompany });
    } catch (error) {
      console.error('Error uploading company logo:', error);
      res.status(500).json({ error: 'Failed to upload company logo' });
    }
  });

  // Get company posts
  app.get('/api/companies/:id/posts', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      const posts = await storage.getCompanyPosts(id);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching company posts:', error);
      res.status(500).json({ error: 'Failed to fetch company posts' });
    }
  });

  // Get company jobs
  app.get('/api/companies/:id/jobs', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      const jobs = await storage.getCompanyJobs(id);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      res.status(500).json({ error: 'Failed to fetch company jobs' });
    }
  });

  // Create company post
  app.post('/api/companies/:id/posts', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      if (company.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized: You do not own this company' });
      }
      
      // Create a new post, ideally with a companyId field
      // For now, we'll just create a regular post from the owner
      const post = await storage.createPost({
        content: req.body.content,
        userId: req.user!.id,
        imageUrl: req.body.imageUrl,
        isAnonymous: false,
        communityId: null
      });
      
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating company post:', error);
      res.status(500).json({ error: 'Failed to create company post' });
    }
  });

  // Get user companies (all companies for a specific user)
  app.get('/api/users/:id/companies', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const companies = await storage.getUserCompanies(userId);
      res.json(companies);
    } catch (error) {
      console.error('Error fetching user companies:', error);
      res.status(500).json({ error: 'Failed to fetch user companies' });
    }
  });

  // Get current user's companies
  app.get('/api/user/companies', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const companies = await storage.getUserCompanies(req.user!.id);
      res.json(companies);
    } catch (error) {
      console.error('Error fetching current user companies:', error);
      res.status(500).json({ error: 'Failed to fetch your companies' });
    }
  });
}