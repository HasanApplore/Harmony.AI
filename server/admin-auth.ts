import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

// Extend the session interface to include adminId
declare module "express-session" {
  interface SessionData {
    adminId?: number;
  }
}

const scryptAsync = promisify(scrypt);

// Middleware to check if user is an admin
export function isAdminAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.adminId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized: Admin access required" });
  }
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAdminAuth(app: Express) {
  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    try {
      // Get the user
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if user is a recruiter (admin)
      if (!user.isRecruiter) {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set admin session
      req.session.adminId = user.id;
      
      // Return success with minimal user data (don't include password)
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: true,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin session check endpoint
  app.get("/api/admin/session", isAdminAuthenticated, (req, res) => {
    res.status(200).json({ adminId: req.session.adminId });
  });
  
  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    if (req.session.adminId) {
      delete req.session.adminId;
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying admin session:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.status(200).json({ message: "Admin logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Already logged out" });
    }
  });
}