import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { setupAdminAuth } from "./admin-auth";
import { setupAdminRoutes } from "./admin-routes";
import userRoutes from "./routes/user-routes";
import postRoutes from "./routes/post-routes";
import userTypeFixRoutes from "./routes/user-type-fix";
import { insertJobSchema, insertPostSchema, insertCommunitySchema, insertJobApplicationSchema, insertConnectionSchema, insertMessageSchema, InsertPost, InsertUser } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { analyzeVideoResume, generatePersonalizedTips } from "./ai-analysis";
import { generatePostSuggestions, enhanceUserPost } from "./ai-post-suggestions";

// Function to add sample connections for development
async function addSampleConnections() {
  try {
    // Get user with id 2 (logged in user)
    const user = await storage.getUser(2);
    if (!user) {
      console.log("Logged in user not found, skipping connection creation");
      return;
    }
    
    // Check if we already have connections for this user
    const existingConnections = await storage.getUserConnections(2);
    if (existingConnections.length > 0) {
      console.log("Sample connections already exist, skipping creation");
      return;
    }
    
    console.log("Adding sample connections...");
    
    // Create connections with users 3 and 4 (will be accepted)
    const connection1 = await storage.createConnection({
      requesterId: 3, // Priya Sharma
      receiverId: 2  // Logged in user
    });
    
    const connection2 = await storage.createConnection({
      requesterId: 2, // Logged in user
      receiverId: 4  // Arjun Patel
    });
    
    // Update them to accepted status
    await storage.updateConnectionStatus(connection1.id, "accepted");
    await storage.updateConnectionStatus(connection2.id, "accepted");
    
    // Create pending connections with users 5 and 6
    await storage.createConnection({
      requesterId: 5, // Divya Reddy
      receiverId: 2  // Logged in user
    });
    
    await storage.createConnection({
      requesterId: 6, // Rajesh Kumar
      receiverId: 2  // Logged in user
    });
    
    console.log("Sample connections created successfully");
  } catch (error) {
    console.error("Error adding sample connections:", error);
  }
}

// Add sample communities
async function addSampleCommunities() {
  try {
    const sampleCommunities = [
      {
        id: 1,
        name: "Tech Professionals",
        description: "A community for tech professionals in Bangalore to network, share knowledge, and discuss industry trends",
        createdBy: 3, // Sample user ID
        isPrivate: false,
        inviteOnly: false,
      },
      {
        id: 2,
        name: "Delhi UX Designers",
        description: "Connect with UX designers in Delhi to share design insights, job opportunities, and collaborate on projects",
        createdBy: 4,
        isPrivate: false,
        inviteOnly: false,
      },
      {
        id: 3,
        name: "Mumbai Software Engineers",
        description: "A group for software engineers in Mumbai to discuss technical challenges, share solutions, and network",
        createdBy: 6,
        isPrivate: false,
        inviteOnly: false,
      },
      {
        id: 4,
        name: "AI & Machine Learning India",
        description: "Discuss the latest in artificial intelligence and machine learning with professionals across India",
        createdBy: 5,
        isPrivate: false,
        inviteOnly: false,
      },
      {
        id: 5,
        name: "Women in Tech Leadership",
        description: "Supporting and connecting women in technology leadership roles across industries",
        createdBy: 7,
        isPrivate: false,
        inviteOnly: false,
      },
      {
        id: 6,
        name: "Product Managers Network",
        description: "For product managers to share insights, discuss strategies, and advance their careers",
        createdBy: 5,
        isPrivate: false,
        inviteOnly: false,
      },
      {
        id: 7,
        name: "Digital Marketing Professionals",
        description: "Connect with digital marketing experts to discuss trends, tools, and techniques",
        createdBy: 7,
        isPrivate: false,
        inviteOnly: false,
      },
      {
        id: 8,
        name: "Data Science Enthusiasts",
        description: "A community for data scientists, analysts, and enthusiasts to share knowledge and experiences",
        createdBy: 6,
        isPrivate: false,
        inviteOnly: false,
      },
    ];

    for (const community of sampleCommunities) {
      try {
        // Check if community already exists
        const existing = await storage.getCommunityById(community.id);
        if (!existing) {
          await storage.createCommunity(community);
          console.log(`Created sample community: ${community.name}`);
        }
      } catch (error) {
        // Community doesn't exist, create it
        try {
          await storage.createCommunity(community);
          console.log(`Created sample community: ${community.name}`);
        } catch (createError) {
          console.error(`Failed to create community ${community.name}:`, createError);
        }
      }
    }
  } catch (error) {
    console.error("Error adding sample communities:", error);
  }
}

// Function to add sample messages for the messaging feature
async function addSampleMessages() {
  try {
    // Check if messages already exist
    const user = await storage.getUser(2); // Logged-in user
    if (!user) {
      console.log("Logged in user not found, skipping message creation");
      return;
    }
    
    // Get the first few messages to check if they exist
    const existingMessages = await storage.getMessagesBetweenUsers(2, 3);
    if (existingMessages.length > 0) {
      console.log("Sample messages already exist, skipping creation");
      return;
    }
    
    console.log("Adding sample messages...");
    
    // Add conversation with Priya Sharma (user 3)
    const priyaMessages = [
      {
        senderId: 3,
        receiverId: 2,
        content: "Hi Vansh, I noticed you're also in the business analytics field. I'm working on a project that might interest you.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        senderId: 2,
        receiverId: 3,
        content: "Hello Priya, that sounds interesting! What kind of project is it?",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
      },
      {
        senderId: 3,
        receiverId: 2,
        content: "It's about optimizing customer journey analytics for e-commerce platforms. I saw your experience with visualization tools - would love to get your insights.",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        senderId: 2,
        receiverId: 3,
        content: "That's right in my wheelhouse! I've worked on similar projects. Would you like to schedule a call to discuss this further?",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000)
      },
      {
        senderId: 3,
        receiverId: 2,
        content: "That would be great! How about next Tuesday at 3 PM IST?",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Add conversation with Arjun Patel (user 4)
    const arjunMessages = [
      {
        senderId: 2,
        receiverId: 4,
        content: "Hi Arjun, I was really impressed by your recent open-source library for video processing. How long did it take you to develop it?",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        senderId: 4,
        receiverId: 2,
        content: "Thanks Vansh! It took about three months from concept to release. The hardest part was optimizing for different browsers.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
      },
      {
        senderId: 2,
        receiverId: 4,
        content: "That's impressive turnaround. I'm looking to implement something similar for our business analysis dashboards to include video summaries. Would you be open to consulting on that?",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        senderId: 4,
        receiverId: 2,
        content: "Absolutely, that sounds like an interesting application. Let me know what your requirements are and we can definitely explore this.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Save all messages to the database
    for (const message of [...priyaMessages, ...arjunMessages]) {
      await storage.createMessage(message);
    }
    
    console.log("Sample messages created successfully");
  } catch (error) {
    console.error("Error adding sample messages:", error);
  }
}

// Function to add sample Indian users and posts for development
async function addSampleIndianPosts() {
  try {
    // Check if we already have posts
    const existingPosts = await storage.getPosts();
    if (existingPosts.length > 0) {
      console.log("Sample posts already exist, skipping creation");
      return;
    }
    
    console.log("Adding sample Indian users and posts...");
    
    // Create sample Indian users if they don't exist
    const userEmails = [
      "priya.sharma@example.com",
      "arjun.patel@example.com",
      "divya.reddy@example.com",
      "rajesh.kumar@example.com",
      "ananya.singh@example.com"
    ];
    
    const sampleUsers = [
      {
        username: "priyasharma",
        password: "secure_password_hash", // In a real app, this would be hashed
        email: "priya.sharma@example.com",
        name: "Priya Sharma",
        title: "Senior UX Designer at DesignHub",
        isRecruiter: false,
        profileImageUrl: "https://randomuser.me/api/portraits/women/12.jpg",
        privacySettings: { profileVisibility: "all", digitalCvVisibility: "all" }
      },
      {
        username: "arjunpatel",
        password: "secure_password_hash",
        email: "arjun.patel@example.com",
        name: "Arjun Patel",
        title: "Software Engineer at TechInnovate",
        isRecruiter: false,
        profileImageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
        privacySettings: { profileVisibility: "all", digitalCvVisibility: "all" }
      },
      {
        username: "divyareddy",
        password: "secure_password_hash",
        email: "divya.reddy@example.com",
        name: "Divya Reddy",
        title: "Product Manager at GrowthLabs",
        isRecruiter: false,
        profileImageUrl: "https://randomuser.me/api/portraits/women/32.jpg",
        privacySettings: { profileVisibility: "all", digitalCvVisibility: "all" }
      },
      {
        username: "rajeshkumar",
        password: "secure_password_hash",
        email: "rajesh.kumar@example.com",
        name: "Rajesh Kumar",
        title: "Data Scientist at AI Solutions",
        isRecruiter: false,
        profileImageUrl: "https://randomuser.me/api/portraits/men/42.jpg",
        privacySettings: { profileVisibility: "all", digitalCvVisibility: "all" }
      },
      {
        username: "ananyasingh",
        password: "secure_password_hash",
        email: "ananya.singh@example.com",
        name: "Ananya Singh",
        title: "Marketing Director at BrandConnect",
        isRecruiter: true,
        profileImageUrl: "https://randomuser.me/api/portraits/women/52.jpg",
        privacySettings: { profileVisibility: "all", digitalCvVisibility: "all" }
      }
    ];
    
    const createdUsers = [];
    
    // Check if users exist and create them if they don't
    for (const user of sampleUsers) {
      const existingUser = await storage.getUserByEmail(user.email);
      if (!existingUser) {
        // Hash password properly
        const hashedUser = {
          ...user,
          password: await hashPassword(user.password)
        };
        const createdUser = await storage.createUser(hashedUser as InsertUser);
        createdUsers.push(createdUser);
        console.log(`Created sample user: ${createdUser.name}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`Sample user already exists: ${existingUser.name}`);
      }
    }
    
    // Add sample posts
    const samplePosts = [
      {
        content: "Just completed a UX research study on how job seekers in Bangalore interact with digital profiles. The insights were fascinating! Users spend 40% more time on profiles with video introductions. Has anyone else noticed this trend? #UXResearch #DigitalCV",
        userId: createdUsers[0].id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        content: "I'm excited to share that I've just launched a new open-source library for optimizing video processing in web applications. Perfect for platforms handling video resumes! Check it out: github.com/arjunp/videoprocess #OpenSource #WebDevelopment",
        userId: createdUsers[1].id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) // 8 hours ago
      },
      {
        content: "After analyzing our latest product metrics at our Delhi office, we've seen a 65% increase in job application completion rates when candidates can submit video introductions along with traditional resumes. The future of recruiting is definitely video-first! #ProductInsights #Recruitment",
        userId: createdUsers[2].id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        content: "Just attended an AI conference in Hyderabad where we discussed how machine learning can help match job seekers with the right opportunities based on their video profiles. The potential for AI-driven recruiting in India is enormous! #ArtificialIntelligence #JobMatching",
        userId: createdUsers[3].id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36) // 1.5 days ago
      },
      {
        content: "We're hiring! Looking for talented React developers in Mumbai who can help us build the next generation of recruiting tools. Experience with video processing is a plus. DM me if interested or if you know someone who might be! #Hiring #ReactJS #Mumbai",
        userId: createdUsers[4].id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
      }
    ];
    
    for (const post of samplePosts) {
      const createdPost = await storage.createPost(post as InsertPost);
      console.log(`Created sample post by ${createdUsers.find(u => u.id === post.userId)?.name}`);
      
      // Add likes to posts
      // Pick 1-3 random users to like each post
      const numLikes = Math.floor(Math.random() * 3) + 1;
      const uniqueUserIds: number[] = [];
      
      while (uniqueUserIds.length < numLikes) {
        const randomUserIndex = Math.floor(Math.random() * createdUsers.length);
        const likerId = createdUsers[randomUserIndex].id;
        // Don't let users like their own posts and avoid duplicates
        if (likerId !== post.userId && !uniqueUserIds.includes(likerId)) {
          uniqueUserIds.push(likerId);
        }
      }
      
      for (const likerId of uniqueUserIds) {
        await storage.addLike(likerId, createdPost.id);
        console.log(`Added like from ${createdUsers.find(u => u.id === likerId)?.name} to post`);
      }
      
      // Add comments to posts
      // Add 0-2 random comments to each post
      const numComments = Math.floor(Math.random() * 3);
      const commentTexts = [
        "Great insights! This is very relevant for the Indian tech industry.",
        "Totally agree with this. We're seeing the same trends in Mumbai.",
        "Very interesting perspective. Would love to try this approach at our Hyderabad office.",
        "Thanks for sharing! This could revolutionize how we recruit in India.",
        "I've noticed similar patterns in Pune's tech sector. Video profiles are the future."
      ];
      
      const commenters: number[] = [];
      
      while (commenters.length < numComments) {
        const randomUserIndex = Math.floor(Math.random() * createdUsers.length);
        const commenterId = createdUsers[randomUserIndex].id;
        // Try to avoid self-comments and duplicates
        if ((commenterId !== post.userId || Math.random() > 0.8) && !commenters.includes(commenterId)) {
          commenters.push(commenterId);
        }
      }
      
      for (const commenterId of commenters) {
        const randomCommentIndex = Math.floor(Math.random() * commentTexts.length);
        await storage.addComment(
          commenterId, 
          createdPost.id, 
          commentTexts[randomCommentIndex]
        );
        console.log(`Added comment from ${createdUsers.find(u => u.id === commenterId)?.name} to post`);
      }
    }
    
    console.log("Sample Indian users and posts added successfully!");
  } catch (error) {
    console.error("Error adding sample posts:", error);
  }
}

// hashPassword already imported above

// Function to update profile images for existing sample users
async function updateSampleUserProfileImages() {
  try {
    console.log("Updating profile images for sample users...");
    
    const profileImages = {
      "priyasharma": "https://randomuser.me/api/portraits/women/12.jpg",
      "arjunpatel": "https://randomuser.me/api/portraits/men/22.jpg",
      "divyareddy": "https://randomuser.me/api/portraits/women/32.jpg",
      "rajeshkumar": "https://randomuser.me/api/portraits/men/42.jpg",
      "ananyasingh": "https://randomuser.me/api/portraits/women/52.jpg",
      "Vanshgr": "https://randomuser.me/api/portraits/men/36.jpg", // Add Vansh Grover's profile image
      "AC Jain": "https://randomuser.me/api/portraits/men/75.jpg" // Add default profile image for AC Jain
    };
    
    for (const [username, imageUrl] of Object.entries(profileImages)) {
      const user = await storage.getUserByUsername(username);
      if (user) {
        // Only update if the user doesn't already have a profile image
        if (!user.profileImageUrl) {
          await storage.updateUser(user.id, { profileImageUrl: imageUrl });
          console.log(`Updated profile image for ${username}`);
        } else {
          console.log(`User ${username} already has a profile image`);
        }
      }
    }
    
    console.log("Profile image updates completed");
  } catch (error) {
    console.error("Error updating profile images:", error);
  }
}

import { setupCompanyRoutes } from "./company-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Setup admin auth routes (/api/admin/login, /api/admin/logout, /api/admin/session)
  setupAdminAuth(app);
  
  // Setup company routes
  setupCompanyRoutes(app);
  
  // Add sample messages for testing the messaging feature
  await addSampleMessages();
  
  // Setup admin routes
  setupAdminRoutes(app);
  
  // Setup user routes
  app.use('/api/users', userRoutes);
  
  // Setup post routes
  app.use('/api/posts', postRoutes);
  
  // Setup user type fix routes
  app.use('/api/system', userTypeFixRoutes);

  // Add companies API route
  app.get("/api/companies", async (req, res, next) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  });
  
  // Add sample posts with Indian users for development
  await addSampleIndianPosts();
  
  // Update profile images for existing sample users
  await updateSampleUserProfileImages();
  
  // Add sample connections for the current user
  await addSampleConnections();
  
  // Add sample communities if they don't exist
  await addSampleCommunities();
  
  // Setup uploads directory for serving uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Add trending topics endpoint
  app.get("/api/trending/topics", (req, res) => {
    const trendingTopics = [
      {
        id: 1,
        title: "AI in Indian Tech Recruitment",
        professionals: 1240,
        description: "How artificial intelligence is transforming hiring practices in India's tech industry",
        relatedPosts: 87,
        hashtags: ["AIRecruitment", "TechHiring", "IndianTech"]
      },
      {
        id: 2,
        title: "Future of Work in Bengaluru",
        professionals: 986,
        description: "Examining remote work trends and office culture shifts in India's Silicon Valley",
        relatedPosts: 65,
        hashtags: ["BengaluruTech", "RemoteWork", "FutureOfWork"]
      },
      {
        id: 3,
        title: "Digital CVs in Indian Job Market",
        professionals: 742,
        description: "How video resumes and digital portfolios are changing candidate evaluation",
        relatedPosts: 53,
        hashtags: ["DigitalCV", "VideoResume", "JobSearch"]
      },
      {
        id: 4,
        title: "Tech Startups in Mumbai",
        professionals: 658,
        description: "The growing ecosystem of technology startups in Mumbai's financial district",
        relatedPosts: 42,
        hashtags: ["MumbaiStartups", "TechInnovation", "StartupLife"]
      },
      {
        id: 5,
        title: "Data Science Careers in Chennai",
        professionals: 524,
        description: "Opportunities and challenges for data scientists in Chennai's job market",
        relatedPosts: 38,
        hashtags: ["DataScience", "ChennaiTech", "AIJobs"]
      }
    ];
    
    res.json(trendingTopics);
  });
  
  // Add recommended jobs endpoint with sample data
  app.get("/api/jobs/recommended", (req, res) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "You must be logged in to get job recommendations" });
    }
    
    // In a real app, these would be based on user's skills, experience, etc.
    const recommendedJobs = [
      {
        id: 1,
        title: "Senior Business Analyst",
        company: "TechSolutions India",
        location: "Bengaluru, Karnataka",
        description: "Looking for an experienced Business Analyst to join our growing tech team. The ideal candidate will have strong analytical skills and experience in the tech industry.",
        skills: ["Business Analysis", "Data Visualization", "Agile Methodologies", "SQL", "Power BI"],
        matchPercentage: 95,
        salary: "₹18-25 LPA",
        jobType: "Full-time",
        experienceLevel: "Senior (5+ years)",
        companyLogo: "https://via.placeholder.com/64x64/8B5CF6/FFFFFF?text=TS",
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 3
      },
      {
        id: 2,
        title: "Product Analyst",
        company: "InnovateHub",
        location: "Delhi, Remote",
        description: "Join our product team to drive data-informed decisions. You'll analyze user behavior, create reports, and work with cross-functional teams to optimize our products.",
        skills: ["Product Analytics", "SQL", "Python", "User Research", "A/B Testing"],
        matchPercentage: 88,
        salary: "₹12-18 LPA",
        jobType: "Full-time",
        experienceLevel: "Mid-level (3-5 years)",
        companyLogo: "https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=IH",
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 4
      },
      {
        id: 3,
        title: "Financial Analyst",
        company: "GlobalFinance",
        location: "Mumbai, Maharashtra",
        description: "Seeking a detail-oriented Financial Analyst to join our team. You will prepare financial reports, analyze business performance, and help make strategic recommendations.",
        skills: ["Financial Modeling", "Excel", "Business Analysis", "Forecasting", "Budgeting"],
        matchPercentage: 82,
        salary: "₹15-20 LPA",
        jobType: "Full-time",
        experienceLevel: "Mid-level (3-5 years)",
        companyLogo: "https://via.placeholder.com/64x64/059669/FFFFFF?text=GF",
        postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 5
      }
    ];
    
    res.json(recommendedJobs);
  });

  // Get all users (for discovery/connection suggestions)
  app.get("/api/users", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const users = await storage.getAllUsers();
      
      // Filter out the current user and return only necessary fields for privacy
      const filteredUsers = users
        .filter(u => u.id !== req.user.id)
        .map(u => ({
          id: u.id,
          username: u.username,
          name: u.name,
          title: u.title,
          profileImageUrl: u.profileImageUrl,
          skills: u.skills
        }));
        
      res.json(filteredUsers);
    } catch (error) {
      next(error);
    }
  });

  // User profile routes
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id", async (req, res, next) => {
    if (!req.isAuthenticated() || req.user.id !== parseInt(req.params.id)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.updateUser(parseInt(req.params.id), req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  // Post routes
  app.post("/api/posts", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts", async (req, res, next) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:id", async (req, res, next) => {
    try {
      const post = await storage.getPostById(parseInt(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id/posts", async (req, res, next) => {
    try {
      const posts = await storage.getPostsByUserId(parseInt(req.params.id));
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  // Update post route (only post owner can edit)
  app.patch("/api/posts/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check if the current user is the owner of the post
      if (post.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only edit your own posts" });
      }

      const updatedPost = await storage.updatePost(postId, { content: content.trim() });
      res.json(updatedPost);
    } catch (error) {
      next(error);
    }
  });

  // Delete post route (only post owner can delete)
  app.delete("/api/posts/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check if the current user is the owner of the post
      if (post.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }

      await storage.deletePost(postId);
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Reaction routes
  app.post("/api/posts/:id/reaction", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const { type = "like" } = req.body;
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const like = await storage.addLike(req.user.id, postId);
      res.status(201).json(like);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/posts/:id/reaction", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const success = await storage.removeLike(req.user.id, postId);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Reaction not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:id/reactions", async (req, res, next) => {
    try {
      const likes = await storage.getPostLikes(parseInt(req.params.id));
      res.json(likes);
    } catch (error) {
      next(error);
    }
  });
  
  // Keep the old routes for backward compatibility
  app.post("/api/posts/:id/like", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const like = await storage.addLike(req.user.id, postId);
      res.status(201).json(like);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/posts/:id/like", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const success = await storage.removeLike(req.user.id, postId);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Like not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:id/likes", async (req, res, next) => {
    try {
      const likes = await storage.getPostLikes(parseInt(req.params.id));
      res.json(likes);
    } catch (error) {
      next(error);
    }
  });

  // Repost routes
  app.post("/api/posts/:id/repost", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const originalPost = await storage.getPostById(postId);
      if (!originalPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check if user already reposted this
      const existingRepost = await storage.getUserRepost(req.user.id, postId);
      if (existingRepost) {
        return res.status(400).json({ message: "Post already reposted" });
      }

      // Create a new post entry with repost attribution
      const repostData = {
        userId: req.user.id,
        content: originalPost.content,
        imageUrl: originalPost.imageUrl,
        isAnonymous: false,
        communityId: originalPost.communityId,
        originalPostId: postId,
        repostedBy: req.user.id
      };

      const newRepost = await storage.createPost(repostData);
      
      // Also track in reposts table for counting
      await storage.addRepost(req.user.id, postId);
      
      res.status(201).json(newRepost);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/posts/:id/repost", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const success = await storage.removeRepost(req.user.id, postId);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Repost not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:id/reposts", async (req, res, next) => {
    try {
      const reposts = await storage.getPostReposts(parseInt(req.params.id));
      res.json(reposts);
    } catch (error) {
      next(error);
    }
  });

  // Comment routes
  app.post("/api/posts/:id/comments", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const { content } = z.object({ content: z.string().min(1) }).parse(req.body);

      const comment = await storage.addComment(req.user.id, postId, content);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:id/comments", async (req, res, next) => {
    try {
      const comments = await storage.getPostComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });

  // Job routes
  app.post("/api/jobs", async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isRecruiter) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const jobData = insertJobSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs", async (req, res, next) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });
  
  // The saved jobs route needs to come before the /:id route to avoid conflicts
  app.get("/api/jobs/saved", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view saved jobs" });
    }

    try {
      const savedJobs = await storage.getSavedJobsByUserId(req.user.id);
      res.json(savedJobs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:id", async (req, res, next) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  });
  
  // Saved jobs routes
  app.post("/api/jobs/:id/save", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to save jobs" });
    }

    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const savedJob = await storage.saveJob(req.user.id, jobId);
      res.status(201).json(savedJob);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/jobs/:id/save", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to unsave jobs" });
    }

    try {
      const jobId = parseInt(req.params.id);
      const result = await storage.unsaveJob(req.user.id, jobId);
      
      if (!result) {
        return res.status(404).json({ message: "Saved job not found" });
      }
      
      res.status(200).json({ message: "Job unsaved successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/jobs/:id/saved", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to check saved status" });
    }

    try {
      const jobId = parseInt(req.params.id);
      const isSaved = await storage.isJobSavedByUser(req.user.id, jobId);
      res.json({ saved: isSaved });
    } catch (error) {
      next(error);
    }
  });

  // Job application routes
  app.post("/api/jobs/:id/apply", async (req, res, next) => {
    if (!req.isAuthenticated() || req.user.isRecruiter) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Extract application data from request body
      const { coverLetter, experience, education, skills, ...rest } = req.body;
      
      // Create application record
      const applicationData = insertJobApplicationSchema.parse({
        jobId,
        applicantId: req.user.id,
        note: coverLetter || ""
      });
      
      const application = await storage.createJobApplication(applicationData);
      
      // Update user profile with any new skills
      if (skills && skills.length > 0) {
        try {
          const skillsArray = skills.split(',').map((s: string) => s.trim());
          const updatedUser = await storage.updateUser(req.user.id, {
            ...req.user,
            skills: skillsArray
          });
        } catch (error) {
          console.error("Error updating user skills:", error);
          // Continue processing even if skill update fails
        }
      }
      
      // Return application data to client
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/applications", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      if (req.user.isRecruiter) {
        // Get jobs posted by the recruiter
        const jobs = await storage.getJobsByUserId(req.user.id);
        const applications = [];
        
        for (const job of jobs) {
          const jobApplications = await storage.getJobApplicationsByJobId(job.id);
          applications.push(...jobApplications);
        }
        
        res.json(applications);
      } else {
        // Get applications made by the job seeker
        const applications = await storage.getJobApplicationsByUserId(req.user.id);
        res.json(applications);
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/applications/:id/status", async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isRecruiter) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      
      const application = await storage.updateJobApplicationStatus(parseInt(req.params.id), status);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      next(error);
    }
  });

  // Community routes
  app.post("/api/communities", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const communityData = insertCommunitySchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const community = await storage.createCommunity(communityData);
      res.status(201).json(community);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/communities", async (req, res, next) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/communities/:id", async (req, res, next) => {
    try {
      const community = await storage.getCommunityById(parseInt(req.params.id));
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/communities/:id/join", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const communityId = parseInt(req.params.id);
      
      // Add validation for communityId
      if (isNaN(communityId) || communityId <= 0) {
        return res.status(400).json({ message: "Invalid community ID" });
      }
      
      console.log(`User ${req.user.id} attempting to join community ${communityId}`);
      
      const community = await storage.getCommunityById(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      const success = await storage.addCommunityMember(req.user.id, communityId);
      if (success) {
        console.log(`User ${req.user.id} successfully joined community ${communityId}`);
        res.sendStatus(204);
      } else {
        console.log(`User ${req.user.id} failed to join community ${communityId} - may already be a member`);
        res.status(400).json({ message: "Failed to join community" });
      }
    } catch (error) {
      console.error("Error joining community:", error);
      next(error);
    }
  });

  app.delete("/api/communities/:id/leave", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const communityId = parseInt(req.params.id);
      
      // Add validation for communityId
      if (isNaN(communityId) || communityId <= 0) {
        return res.status(400).json({ message: "Invalid community ID" });
      }
      
      console.log(`User ${req.user.id} attempting to leave community ${communityId}`);
      
      const community = await storage.getCommunityById(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      const success = await storage.removeCommunityMember(req.user.id, communityId);
      if (success) {
        res.status(200).json({ message: "Successfully left community" });
      } else {
        res.status(404).json({ message: "You are not a member of this community" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/communities/:id/members", async (req, res, next) => {
    try {
      const members = await storage.getCommunityMembers(parseInt(req.params.id));
      res.json(members);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/communities/:id/posts", async (req, res, next) => {
    try {
      const posts = await storage.getPostsByCommunityId(parseInt(req.params.id));
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id/communities", async (req, res, next) => {
    try {
      const communities = await storage.getUserCommunities(parseInt(req.params.id));
      res.json(communities);
    } catch (error) {
      next(error);
    }
  });

  // Connection routes
  app.post("/api/connections", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const connectionData = insertConnectionSchema.parse({
        ...req.body,
        requesterId: req.user.id
      });
      
      // Check if the user is trying to connect with themselves
      if (connectionData.requesterId === connectionData.receiverId) {
        return res.status(400).json({ message: "Cannot connect with yourself" });
      }

      const connection = await storage.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/connections/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      
      const connection = await storage.updateConnectionStatus(parseInt(req.params.id), status);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.json(connection);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/connections", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const connections = await storage.getUserConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/connections/pending", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const connections = await storage.getPendingConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/connections/sent-pending", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const connections = await storage.getSentPendingConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      next(error);
    }
  });

  // Message routes
  app.post("/api/messages", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/messages/:userId", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getMessagesBetweenUsers(req.user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/messages", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const messages = await storage.getUserMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  // Configure multer for video uploads
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 200 * 1024 * 1024, // 200MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    }
  });

  // Digital CV upload endpoint
  app.post("/api/digital-cv/upload", upload.single('video'), async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      const videoPath = req.file.path;
      const videoUrl = `/uploads/${req.file.filename}`;
      
      // Update user's digital CV URL
      await storage.updateUser(req.user.id, { digitalCvUrl: videoUrl });
      
      // For now, provide basic feedback without AI analysis
      const analysis = {
        summary: "Your digital CV has been uploaded successfully! Great job on creating a video resume.",
        keyStrengths: ["Professional presentation", "Clear communication"],
        improvementAreas: ["Consider adding specific achievements", "Practice maintaining eye contact"],
        overallScore: 8,
        feedback: "Well done! Your video resume shows good communication skills. Consider highlighting specific accomplishments and maintaining consistent eye contact with the camera."
      };
      
      res.json({
        message: "Digital CV uploaded successfully",
        videoUrl,
        analysis
      });
    } catch (error) {
      console.error("Error uploading digital CV:", error);
      res.status(500).json({ message: "Failed to upload digital CV" });
    }
  });

  // Get Digital CV analysis
  app.get("/api/digital-cv/analysis", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      if (!req.user.digitalCvUrl) {
        return res.status(404).json({ message: "No digital CV found" });
      }

      // For existing CVs, generate personalized tips
      const tips = await generatePersonalizedTips(req.user);
      
      res.json({
        tips,
        hasDigitalCv: true,
        cvUrl: req.user.digitalCvUrl
      });
    } catch (error) {
      console.error("Error getting CV analysis:", error);
      res.status(500).json({ message: "Failed to get CV analysis" });
    }
  });

  // Delete Digital CV
  app.delete("/api/digital-cv", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      if (!req.user.digitalCvUrl) {
        return res.status(404).json({ message: "No digital CV found" });
      }

      // Remove the digital CV URL from user record
      await storage.updateUser(req.user.id, { digitalCvUrl: null });
      
      // Optionally delete the file from filesystem
      // Note: In production, you might want to keep files for a period before deletion
      try {
        const filePath = path.join(process.cwd(), req.user.digitalCvUrl);
        await fs.unlink(filePath);
      } catch (fileError: any) {
        console.log("File deletion failed, but database updated:", fileError?.message || "Unknown error");
      }

      res.json({ message: "Digital CV deleted successfully" });
    } catch (error) {
      console.error("Error deleting digital CV:", error);
      res.status(500).json({ message: "Failed to delete digital CV" });
    }
  });

  // AI Post Suggestions endpoint
  app.post("/api/posts/ai-suggestions", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { keyword } = req.body;
      
      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ message: "Keyword is required" });
      }

      // Get user profile for context
      const user = await storage.getUser(req.user.id);
      const userProfile = {
        name: user?.name,
        title: user?.title || undefined,
        industry: user?.industry || undefined,
        skills: user?.skills || []
      };

      const suggestions = await generatePostSuggestions(keyword, userProfile);
      
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating post suggestions:", error);
      res.status(500).json({ message: "Failed to generate post suggestions" });
    }
  });

  // AI Post Enhancement endpoint
  app.post("/api/posts/enhance", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      // Get user profile for context
      const user = await storage.getUser(req.user.id);
      const userProfile = {
        name: user?.name,
        title: user?.title || undefined,
        industry: user?.industry || undefined
      };

      const enhancement = await enhanceUserPost(content, userProfile);
      
      res.json(enhancement);
    } catch (error) {
      console.error("Error enhancing post:", error);
      res.status(500).json({ message: "Failed to enhance post" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // User stats endpoint
  app.get("/api/users/:id/stats", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Posts count
      const posts = await storage.getPostsByUserId(userId);
      const postsCount = posts.length;

      // Simple derived metrics (in a real app you'd track these separately)
      const profileViews = postsCount * 12 + 30; // rough estimate
      const searchAppearances = Math.floor(profileViews / 2);
      const digitalCvViews = user.digitalCvUrl ? Math.floor(profileViews / 3) : 0;

      // Compute profile strength similar to client logic
      let strength = 0;
      if (user.name) strength += 20;
      if (user.title) strength += 20;
      if (user.bio) strength += 20;
      if (user.skills && user.skills.length > 0) strength += 20;
      if (user.digitalCvUrl) strength += 20;

      res.json({
        profileViews,
        digitalCvViews,
        searchAppearances,
        profileStrength: strength,
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
