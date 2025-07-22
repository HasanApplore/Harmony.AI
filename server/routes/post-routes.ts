import express from 'express';
import { storage } from '../storage';
import { InsertPost } from '@shared/schema';

const router = express.Router();

// Add some sample posts for AC Jain
router.post('/add-sample-posts', async (req, res) => {
  try {
    // Check if user exists
    const user = await storage.getUserByUsername('AC Jain');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Sample posts for AC Jain (userId: 8)
    const samplePosts = [
      {
        userId: user.id,
        content: "Excited to announce that we're looking for talented software engineers to join our growing tech team in Bangalore! We're building next-generation AI tools for recruitment. Apply now with your digital CV. #Hiring #TechJobs #Bangalore",
        imageUrl: null,
        isAnonymous: false,
        communityId: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        userId: user.id,
        content: "Just attended the Tech Recruitment Summit 2025 in Mumbai. Great insights on how AI is transforming the hiring process. Looking forward to implementing some of these strategies at our company! #RecruitmentInnovation #AIHiring",
        imageUrl: null,
        isAnonymous: false,
        communityId: null,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        userId: user.id,
        content: "Our latest analysis shows that candidates who submit video introductions are 45% more likely to progress to the interview stage. The future of recruitment is visual and interactive! #HiringTrends #RecruitmentTips",
        imageUrl: null,
        isAnonymous: false,
        communityId: null,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      }
    ];

    const createdPosts = [];
    
    for (const post of samplePosts) {
      const createdPost = await storage.createPost(post as InsertPost);
      createdPosts.push(createdPost);
      
      // Add sample likes to posts
      // Get some sample users to like posts
      const userIds = [3, 4, 5, 6, 7]; // IDs of sample users
      const sampleUsers = [];
      
      for (const id of userIds) {
        const sampleUser = await storage.getUser(id);
        if (sampleUser) {
          sampleUsers.push(sampleUser);
        }
      }
      
      for (const sampleUser of sampleUsers) {
        if (Math.random() > 0.3) { // 70% chance of liking
          await storage.addLike(sampleUser.id, createdPost.id);
        }
      }
      
      // Add sample comments to posts
      const comments = [
        "Great opportunity! Looking forward to applying.",
        "The AI integration in recruitment is fascinating. Would love to hear more about your approach.",
        "This is exactly what the industry needs right now. Innovative thinking!",
        "I've been following your work in this area. Very impressive results!",
        "Would love to connect and discuss this further. This aligns perfectly with my research."
      ];
      
      // Add 1-2 random comments per post
      const commentCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < commentCount; i++) {
        if (sampleUsers[i]) {
          const randomComment = comments[Math.floor(Math.random() * comments.length)];
          await storage.addComment(sampleUsers[i].id, createdPost.id, randomComment);
        }
      }
    }

    return res.status(201).json({ message: 'Sample posts created', posts: createdPosts });
  } catch (error) {
    console.error('Error creating sample posts:', error);
    return res.status(500).json({ error: 'Failed to create sample posts' });
  }
});

export default router;