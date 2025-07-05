import express from 'express';
import { requireAuth, getUserInfo } from '../middleware/auth.js';

const router = express.Router();

// Get current user info
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in token',
      });
    }
    
    const userInfo = await getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User information could not be retrieved',
      });
    }
    
    res.json({
      success: true,
      user: userInfo,
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user information',
    });
  }
});

// Verify token endpoint
router.post('/verify', requireAuth, (req, res) => {
  try {
    res.json({
      success: true,
      userId: req.auth.userId,
      message: 'Token is valid',
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
});

// Get user session info
router.get('/session', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const sessionId = req.auth.sessionId;
    
    const userInfo = await getUserInfo(userId);
    
    res.json({
      success: true,
      session: {
        userId,
        sessionId,
        user: userInfo,
        isAuthenticated: true,
      },
    });
  } catch (error) {
    console.error('Error getting session info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve session information',
    });
  }
});

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Auth Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router; 