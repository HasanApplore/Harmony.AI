import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { hashPassword } from "../auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const router = Router();

// Get the directory paths (works in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const profileImagesDir = path.join(uploadsDir, 'profile-images');
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  }
});

// Check if mobile number is already in use
router.get("/check-mobile", async (req: Request, res: Response) => {
  try {
    const { mobileNumber, countryCode } = req.query;
    
    if (!mobileNumber || typeof mobileNumber !== 'string') {
      return res.status(400).json({ message: "Mobile number is required" });
    }
    
    if (!countryCode || typeof countryCode !== 'string') {
      return res.status(400).json({ message: "Country code is required" });
    }
    
    // Find the selected country
    const selectedCountry = countries.find(c => c.code === countryCode);
    if (!selectedCountry) {
      return res.status(400).json({ 
        message: "Invalid country code",
        exists: false 
      });
    }
    
    // Validate mobile number format based on selected country
    if (!selectedCountry.pattern.test(mobileNumber)) {
      return res.status(400).json({ 
        message: `Please enter a valid ${selectedCountry.name} mobile number`,
        exists: false 
      });
    }
    
    // Check if mobile number length is within range
    if (mobileNumber.length < selectedCountry.minLength || mobileNumber.length > selectedCountry.maxLength) {
      return res.status(400).json({ 
        message: `Mobile number must be ${selectedCountry.minLength}-${selectedCountry.maxLength} digits for ${selectedCountry.name}`,
        exists: false 
      });
    }
    
    // Check if mobile number exists in the database
    const existingUser = await storage.getUserByMobileNumber(mobileNumber);
    
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? "Mobile number already registered" : "Mobile number available"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Check if email is already in use
router.get("/check-email", async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Please enter a valid email address",
        exists: false 
      });
    }
    
    // Check if email exists in the database
    const existingUser = await storage.getUserByEmail(email);
    
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? "Email already registered" : "Email available"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Check if username is already in use
router.get("/check-username", async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: "Username is required" });
    }
    
    // Validate username format (alphanumeric, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores",
        exists: false 
      });
    }
    
    // Check if username exists in the database
    const existingUser = await storage.getUserByUsername(username);
    
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? "Username already taken" : "Username available"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Forgot password - create password reset request
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Please enter a valid email address"
      });
    }
    
    // Check if user exists with this email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        message: "No account found with this email address" 
      });
    }
    
    // Check if there's already a pending request for this user
    const existingRequests = await storage.getPasswordResetRequests();
    const pendingRequest = existingRequests.find(
      request => request.userId === user.id && request.status === 'pending'
    );
    
    if (pendingRequest) {
      return res.status(400).json({ 
        message: "A password reset request is already pending for this account. Please wait for admin approval." 
      });
    }
    
    // Create password reset request
    const resetRequest = await storage.createPasswordResetRequest({
      userId: user.id,
      email: user.email
    });
    
    res.json({ 
      message: "Password reset request submitted successfully. An admin will review your request and contact you with further instructions.",
      requestId: resetRequest.id
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Get user profile (without sensitive info)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove sensitive info
    const { password, ...safeUser } = user;
    
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Update user profile
router.patch("/:id", upload.single('profileImage'), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is authorized to update this profile
    if (req.user?.id !== userId) {
      return res.status(403).json({ message: "You are not authorized to update this profile" });
    }
    
    const userData = await storage.getUser(userId);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prepare update data
    const updateData: any = {
      ...req.body,
    };
    
    // Handle password update
    if (req.body.password) {
      updateData.password = await hashPassword(req.body.password);
    }
    
    // Handle file upload
    if (req.file) {
      // Delete old profile image if exists
      if (userData.profileImageUrl && userData.profileImageUrl.includes('uploads/profile-images')) {
        const oldImagePath = path.join(process.cwd(), userData.profileImageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Set new profile image URL
      updateData.profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
    }
    
    const updatedUser = await storage.updateUser(userId, updateData);
    
    // Remove sensitive info
    const { password, ...safeUser } = updatedUser || {};
    
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Get user's posts
router.get("/:id/posts", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    // Use getPostsByUserId which is already defined in storage
    const posts = await storage.getPostsByUserId(userId);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Get user's jobs
router.get("/:id/jobs", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    // Use getJobsByUserId which is already defined in storage
    const jobs = await storage.getJobsByUserId(userId);
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Country data with phone codes and validation patterns
const countries = [
  { code: "IN", name: "India", phoneCode: "+91", pattern: /^[6-9]\d{9}$/, minLength: 10, maxLength: 10 },
  { code: "US", name: "United States", phoneCode: "+1", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
  { code: "GB", name: "United Kingdom", phoneCode: "+44", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
  { code: "CA", name: "Canada", phoneCode: "+1", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
  { code: "AU", name: "Australia", phoneCode: "+61", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
  { code: "DE", name: "Germany", phoneCode: "+49", pattern: /^\d{10,12}$/, minLength: 10, maxLength: 12 },
  { code: "FR", name: "France", phoneCode: "+33", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
  { code: "JP", name: "Japan", phoneCode: "+81", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
  { code: "BR", name: "Brazil", phoneCode: "+55", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
  { code: "MX", name: "Mexico", phoneCode: "+52", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
];

export default router;