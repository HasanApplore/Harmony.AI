import { Express, Request, Response } from "express";
import { randomUUID } from "crypto";

// Mock data for admin panel
const mockUsers = [
  {
    id: 1,
    name: "Test User",
    username: "testuser",
    email: "testuser@example.com",
    profileImageUrl: null,
    isRecruiter: false,
    createdAt: new Date("2025-01-15")
  },
  {
    id: 3,
    name: "Priya Sharma",
    username: "priyasharma",
    email: "priya.sharma@example.com",
    profileImageUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    isRecruiter: false,
    createdAt: new Date("2025-02-10")
  },
  {
    id: 4,
    name: "Arjun Patel",
    username: "arjunpatel",
    email: "arjun.patel@example.com",
    profileImageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    isRecruiter: false,
    createdAt: new Date("2025-02-22")
  },
  {
    id: 7,
    name: "Ananya Singh",
    username: "ananyasingh",
    email: "ananya.singh@example.com",
    profileImageUrl: "https://randomuser.me/api/portraits/women/52.jpg",
    isRecruiter: true,
    createdAt: new Date("2025-03-05"),
    company: "BrandConnect"
  },
  {
    id: 8,
    name: "Admin",
    username: "admin",
    email: "admin@example.com",
    profileImageUrl: null,
    isRecruiter: true,
    isAdmin: true,
    createdAt: new Date("2025-01-01")
  }
];

const mockJobs = [
  {
    id: 1,
    title: "Senior Business Analyst",
    company: "TechSolutions India",
    location: "Bengaluru, Karnataka",
    jobType: "Full-time",
    experienceLevel: "Senior (5+ years)",
    createdAt: new Date("2025-05-13"),
    userId: 7,
    description: "Looking for an experienced business analyst to join our growing team."
  },
  {
    id: 2,
    title: "Product Analyst",
    company: "InnovateHub",
    location: "Delhi, Remote",
    jobType: "Full-time",
    experienceLevel: "Mid-level (3-5 years)",
    createdAt: new Date("2025-05-10"),
    userId: 7,
    description: "Help us analyze product metrics and drive data-informed decisions."
  }
];

const mockCommunities = [
  {
    id: 1,
    name: "Tech Innovators",
    description: "A community for tech professionals to share innovations and discuss emerging technologies.",
    membersCount: 124,
    isActive: true,
    createdAt: new Date("2025-03-15"),
    creatorId: 3
  },
  {
    id: 2,
    name: "UI/UX Designers Hub",
    description: "Connect with UI/UX designers, share portfolios, and discuss design trends.",
    membersCount: 78,
    isActive: true,
    createdAt: new Date("2025-04-02"),
    creatorId: 4
  }
];

// Authentication middleware for admin routes
const isAdminAuthenticated = (req: Request, res: Response, next: Function) => {
  // For demo purposes, check if adminLoggedIn cookie exists
  if (req.session && req.session.adminLoggedIn) {
    next();
  } else {
    res.status(401).json({ error: "Admin authentication required" });
  }
};

export function setupMockAdminRoutes(app: Express) {
  // Admin login
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    // Simple mock authentication - in a real app, use proper authentication
    if (username === "admin" && password === "admin123") {
      // Set session
      req.session.adminLoggedIn = true;
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
  
  // Check admin session
  app.get("/api/admin/session", (req: Request, res: Response) => {
    if (req.session && req.session.adminLoggedIn) {
      res.status(200).json({ valid: true });
    } else {
      res.status(401).json({ valid: false });
    }
  });
  
  // Admin logout
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.adminLoggedIn = false;
    res.status(200).json({ success: true });
  });
  
  // Get all users
  app.get("/api/admin/users", isAdminAuthenticated, (req: Request, res: Response) => {
    res.json(mockUsers);
  });
  
  // Get user by ID
  app.get("/api/admin/users/:id", isAdminAuthenticated, (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const user = mockUsers.find(u => u.id === userId);
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
  
  // Update user
  app.patch("/api/admin/users/:id", isAdminAuthenticated, (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      // Update user
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...req.body };
      res.json(mockUsers[userIndex]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
  
  // Get all jobs
  app.get("/api/admin/jobs", isAdminAuthenticated, (req: Request, res: Response) => {
    // Add user information to jobs
    const jobsWithUsers = mockJobs.map(job => {
      const user = mockUsers.find(u => u.id === job.userId);
      return {
        ...job,
        user: user ? {
          id: user.id,
          name: user.name,
          username: user.username,
          profileImageUrl: user.profileImageUrl
        } : null
      };
    });
    
    res.json(jobsWithUsers);
  });
  
  // Get job by ID
  app.get("/api/admin/jobs/:id", isAdminAuthenticated, (req: Request, res: Response) => {
    const jobId = parseInt(req.params.id);
    const job = mockJobs.find(j => j.id === jobId);
    
    if (job) {
      const user = mockUsers.find(u => u.id === job.userId);
      
      res.json({
        ...job,
        user: user ? {
          id: user.id,
          name: user.name,
          username: user.username,
          profileImageUrl: user.profileImageUrl
        } : null
      });
    } else {
      res.status(404).json({ error: "Job not found" });
    }
  });
  
  // Get all recruiters
  app.get("/api/admin/recruiters", isAdminAuthenticated, (req: Request, res: Response) => {
    const recruiters = mockUsers
      .filter(user => user.isRecruiter)
      .map(user => {
        const jobsCount = mockJobs.filter(job => job.userId === user.id).length;
        return {
          ...user,
          jobsCount
        };
      });
    
    res.json(recruiters);
  });
  
  // Get all communities
  app.get("/api/admin/communities", isAdminAuthenticated, (req: Request, res: Response) => {
    // Add creator information to communities
    const communitiesWithCreators = mockCommunities.map(community => {
      const creator = mockUsers.find(u => u.id === community.creatorId);
      return {
        ...community,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          username: creator.username,
          profileImageUrl: creator.profileImageUrl
        } : null
      };
    });
    
    res.json(communitiesWithCreators);
  });
  
  // Get analytics data
  app.get("/api/admin/analytics", isAdminAuthenticated, (req: Request, res: Response) => {
    const analytics = {
      userStats: { 
        total: mockUsers.length, 
        activeToday: Math.floor(mockUsers.length * 0.6), 
        growth: 12.5 
      },
      recruiterStats: { 
        total: mockUsers.filter(u => u.isRecruiter).length, 
        activeJobs: mockJobs.length 
      },
      jobStats: { 
        total: mockJobs.length, 
        applications: 318 
      },
      communityStats: { 
        total: mockCommunities.length, 
        posts: 256 
      }
    };
    
    res.json(analytics);
  });
}