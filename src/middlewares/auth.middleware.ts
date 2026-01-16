import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import type { TokenPayload } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token', 401);
      }
    }
    return sendError(res, 'Authentication failed', 401);
  }
};

export const customerAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  authMiddleware(req, res, () => {
    if (req.user?.type !== 'customer') {
      return sendError(res, 'Customer access required', 403);
    }
    next();
  });
};

export const adminAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  authMiddleware(req, res, () => {
    if (req.user?.type !== 'admin') {
      return sendError(res, 'Admin access required', 403);
    }
    next();
  });
};

export const staffAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  authMiddleware(req, res, () => {
    if (req.user?.type !== 'staff') {
      return sendError(res, 'Staff access required', 403);
    }
    next();
  });
};

export const adminOrStaffAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  authMiddleware(req, res, () => {
    if (req.user?.type !== 'admin' && req.user?.type !== 'staff') {
      return sendError(res, 'Admin or Staff access required', 403);
    }
    next();
  });
};