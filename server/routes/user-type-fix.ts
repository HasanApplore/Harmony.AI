import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// Endpoint to fix user types
router.post('/fix-user-types', async (req, res) => {
  try {
    // Update Vansh Grover (user ID 2) to be a regular user
    const vanshUser = await storage.getUser(2);
    if (vanshUser) {
      await storage.updateUser(2, { isRecruiter: false });
      console.log('Updated Vansh Grover to be a regular user');
    }

    // Ensure Akshat Jain (user ID 8) is a recruiter
    const akshatUser = await storage.getUser(8);
    if (akshatUser) {
      await storage.updateUser(8, { isRecruiter: true });
      console.log('Confirmed Akshat Jain as a recruiter');
    }

    return res.status(200).json({ 
      message: 'User types updated successfully',
      vanshUpdated: !!vanshUser,
      akshatUpdated: !!akshatUser
    });
  } catch (error) {
    console.error('Error updating user types:', error);
    return res.status(500).json({ error: 'Failed to update user types' });
  }
});

export default router;