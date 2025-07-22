import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { isAdminAuthenticated } from "./admin-auth";
import { hashPassword } from "./auth";

// Function to set up admin-specific API routes
export function setupAdminRoutes(app: Express) {
  // Get all users
  app.get("/api/admin/users", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // Get user by ID
  app.get("/api/admin/users/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Update user
  app.patch("/api/admin/users/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Get the current user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Handle password update separately (if included)
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updates);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  });
  
  // Delete user
  app.delete("/api/admin/users/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete the user
      await storage.deleteUser(userId);
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  });
  
  // Get all recruiters
  app.get("/api/admin/recruiters", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const recruiters = users.filter(user => user.isRecruiter);
      
      // Get job counts for each recruiter
      const recruitersWithJobCount = await Promise.all(
        recruiters.map(async (recruiter) => {
          const jobs = await storage.getJobsByUserId(recruiter.id);
          return {
            ...recruiter,
            jobsCount: jobs.length
          };
        })
      );
      
      res.json(recruitersWithJobCount);
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      res.status(500).json({ message: "Error fetching recruiters" });
    }
  });
  
  // Get all jobs
  app.get("/api/admin/jobs", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const jobs = await storage.getAllJobs();
      
      // Enhance jobs with user data
      const jobsWithUserData = await Promise.all(
        jobs.map(async (job) => {
          const user = job.userId ? await storage.getUser(job.userId) : null;
          return {
            ...job,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username,
              profileImageUrl: user.profileImageUrl
            } : null
          };
        })
      );
      
      res.json(jobsWithUserData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Error fetching jobs" });
    }
  });
  
  // Get job by ID
  app.get("/api/admin/jobs/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Get the author/user
      const user = job.userId ? await storage.getUser(job.userId) : null;
      
      res.json({
        ...job,
        user: user ? {
          id: user.id,
          name: user.name,
          username: user.username,
          profileImageUrl: user.profileImageUrl
        } : null
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Error fetching job" });
    }
  });
  
  // Update job
  app.patch("/api/admin/jobs/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const updates = req.body;
      
      // Get the current job
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Update the job
      const updatedJob = await storage.updateJob(jobId, updates);
      
      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Error updating job" });
    }
  });
  
  // Delete job
  app.delete("/api/admin/jobs/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      
      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Delete the job
      await storage.deleteJob(jobId);
      
      res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Error deleting job" });
    }
  });
  
  // Get all communities
  app.get("/api/admin/communities", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const communities = await storage.getAllCommunities();
      
      // Enhance communities with creator data and member count
      const enhancedCommunities = await Promise.all(
        communities.map(async (community) => {
          const creator = community.createdBy ? await storage.getUser(community.createdBy) : null;
          const members = await storage.getCommunityMembers(community.id);
          
          return {
            ...community,
            creator: creator ? {
              id: creator.id,
              name: creator.name,
              username: creator.username,
              profileImageUrl: creator.profileImageUrl
            } : null,
            membersCount: members.length
          };
        })
      );
      
      res.json(enhancedCommunities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Error fetching communities" });
    }
  });
  
  // Get community by ID
  app.get("/api/admin/communities/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const communityId = parseInt(req.params.id);
      const community = await storage.getCommunity(communityId);
      
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get the creator
      const creator = community.createdBy ? await storage.getUser(community.createdBy) : null;
      
      // Get members count
      const members = await storage.getCommunityMembers(communityId);
      
      res.json({
        ...community,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          username: creator.username,
          profileImageUrl: creator.profileImageUrl
        } : null,
        membersCount: members.length
      });
    } catch (error) {
      console.error("Error fetching community:", error);
      res.status(500).json({ message: "Error fetching community" });
    }
  });
  
  // Update community
  app.patch("/api/admin/communities/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const communityId = parseInt(req.params.id);
      const updates = req.body;
      
      // Get the current community
      const community = await storage.getCommunity(communityId);
      
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Update the community
      const updatedCommunity = await storage.updateCommunity(communityId, updates);
      
      res.json(updatedCommunity);
    } catch (error) {
      console.error("Error updating community:", error);
      res.status(500).json({ message: "Error updating community" });
    }
  });
  
  // Delete community
  app.delete("/api/admin/communities/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Delete the community
      await storage.deleteCommunity(communityId);
      
      res.status(200).json({ message: "Community deleted successfully" });
    } catch (error) {
      console.error("Error deleting community:", error);
      res.status(500).json({ message: "Error deleting community" });
    }
  });
  
  // Get platform analytics
  app.get("/api/admin/analytics", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get all data
      const users = await storage.getAllUsers();
      const recruiters = users.filter(user => user.isRecruiter);
      const jobs = await storage.getAllJobs();
      const communities = await storage.getAllCommunities();
      const posts = await storage.getAllPosts();
      
      // Calculate job applications
      let totalApplications = 0;
      for (const job of jobs) {
        const applications = await storage.getJobApplicationsByJobId(job.id);
        totalApplications += applications.length;
      }
      
      // Calculate user growth (mock data for demo)
      const userGrowth = 12.5; // Simulated 12.5% growth
      
      const analytics = {
        userStats: {
          total: users.length,
          activeToday: Math.floor(users.length * 0.4), // Simulated 40% active today
          growth: userGrowth
        },
        recruiterStats: {
          total: recruiters.length,
          activeJobs: jobs.length
        },
        jobStats: {
          total: jobs.length,
          applications: totalApplications
        },
        communityStats: {
          total: communities.length,
          posts: posts.filter(post => post.communityId !== null).length
        }
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  // Password Reset Request Management
  
  // Get all password reset requests
  app.get("/api/admin/password-reset-requests", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getPasswordResetRequests();
      
      // Enhance requests with user data
      const requestsWithUserData = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          const processedBy = request.processedBy ? await storage.getUser(request.processedBy) : null;
          
          return {
            ...request,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              profileImageUrl: user.profileImageUrl
            } : null,
            processedBy: processedBy ? {
              id: processedBy.id,
              name: processedBy.name,
              username: processedBy.username
            } : null
          };
        })
      );
      
      res.json(requestsWithUserData);
    } catch (error) {
      console.error("Error fetching password reset requests:", error);
      res.status(500).json({ message: "Error fetching password reset requests" });
    }
  });

  // Get pending password reset requests
  app.get("/api/admin/password-reset-requests/pending", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getPendingPasswordResetRequests();
      
      // Enhance requests with user data
      const requestsWithUserData = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          
          return {
            ...request,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              profileImageUrl: user.profileImageUrl
            } : null
          };
        })
      );
      
      res.json(requestsWithUserData);
    } catch (error) {
      console.error("Error fetching pending password reset requests:", error);
      res.status(500).json({ message: "Error fetching pending password reset requests" });
    }
  });

  // Process password reset request (approve/deny)
  app.patch("/api/admin/password-reset-requests/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { action, adminNotes, temporaryPassword } = req.body;
      
      if (!action || !['approve', 'deny'].includes(action)) {
        return res.status(400).json({ message: "Action must be 'approve' or 'deny'" });
      }
      
      // Get the request
      const requests = await storage.getPasswordResetRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Password reset request not found" });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Request has already been processed" });
      }
      
      // Get admin user
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Admin authentication required" });
      }
      
      const updates: any = {
        status: action === 'approve' ? 'approved' : 'denied',
        processedAt: new Date(),
        processedBy: adminUser.id,
        adminNotes: adminNotes || null
      };
      
      if (action === 'approve') {
        if (!temporaryPassword || typeof temporaryPassword !== 'string') {
          return res.status(400).json({ message: "Temporary password is required for approval" });
        }
        
        // Hash the temporary password
        const hashedPassword = await hashPassword(temporaryPassword);
        
        // Update user's password
        await storage.updateUser(request.userId, { password: hashedPassword });
        
        // Store temporary password in request for reference
        updates.temporaryPassword = temporaryPassword;
      }
      
      // Update the request
      const updatedRequest = await storage.updatePasswordResetRequest(requestId, updates);
      
      res.json({
        message: `Password reset request ${action}d successfully`,
        request: updatedRequest
      });
    } catch (error) {
      console.error("Error processing password reset request:", error);
      res.status(500).json({ message: "Error processing password reset request" });
    }
  });

  // Delete password reset request
  app.delete("/api/admin/password-reset-requests/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      
      // Check if request exists
      const requests = await storage.getPasswordResetRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Password reset request not found" });
      }
      
      // Delete the request
      await storage.deletePasswordResetRequest(requestId);
      
      res.status(200).json({ message: "Password reset request deleted successfully" });
    } catch (error) {
      console.error("Error deleting password reset request:", error);
      res.status(500).json({ message: "Error deleting password reset request" });
    }
  });
}