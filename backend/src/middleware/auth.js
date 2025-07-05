import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

// Configure Clerk with secret key
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable');
}

// Middleware to require authentication
export const requireAuth = ClerkExpressRequireAuth({
  secretKey: clerkSecretKey,
});

// Middleware to optionally check authentication
export const optionalAuth = (req, res, next) => {
  try {
    // Try to get auth from headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = null;
      return next();
    }
    
    // If auth header exists, require valid auth
    return requireAuth(req, res, next);
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.auth = null;
    next();
  }
};

// Middleware to check if user is admin (optional feature)
export const requireAdmin = (req, res, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }
  
  // In a real app, you'd check the user's role from database
  // For now, we'll assume all authenticated users are admins
  // You can extend this to check roles from Clerk metadata or your database
  
  next();
};

// Helper function to get user info from Clerk
export const getUserInfo = async (userId) => {
  try {
    // Import Clerk users API
    const { users } = await import('@clerk/clerk-sdk-node');
    const user = await users.getUser(userId);
    
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

// Error handler for auth errors
export const handleAuthError = (error, req, res, next) => {
  if (error.name === 'UnauthorizedError' || error.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
  
  if (error.name === 'ForbiddenError' || error.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions',
    });
  }
  
  // Pass other errors to the main error handler
  next(error);
};

export default {
  requireAuth,
  optionalAuth,
  requireAdmin,
  getUserInfo,
  handleAuthError,
}; 