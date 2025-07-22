import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Middleware to check if the user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Using isRecruiter temporarily as an admin check
  // In the future, we would add a proper isAdmin field to the user model
  if (!req.user.isRecruiter) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
}

export function setupAdminRoutes(app: Express) {
  // Get all users
  app.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a user (e.g., make admin)
  app.patch("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a user
  app.delete("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all posts (with user info)
  app.get("/api/admin/posts", isAdmin, async (req, res, next) => {
    try {
      const posts = await storage.getAllPostsWithUsers();
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a post
  app.delete("/api/admin/posts/:id", isAdmin, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      
      const success = await storage.deletePost(postId);
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all jobs (with recruiter info)
  app.get("/api/admin/jobs", isAdmin, async (req, res, next) => {
    try {
      const jobs = await storage.getAllJobsWithUsers();
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a job
  app.delete("/api/admin/jobs/:id", isAdmin, async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      
      const success = await storage.deleteJob(jobId);
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all communities (with creator info)
  app.get("/api/admin/communities", isAdmin, async (req, res, next) => {
    try {
      const communities = await storage.getAllCommunitiesWithCreators();
      res.json(communities);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a community
  app.delete("/api/admin/communities/:id", isAdmin, async (req, res, next) => {
    try {
      const communityId = parseInt(req.params.id);
      
      const success = await storage.deleteCommunity(communityId);
      if (!success) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
}