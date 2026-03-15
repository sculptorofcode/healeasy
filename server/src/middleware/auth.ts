import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; email: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 401);
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      email: string;
    };

    // Check if user still exists in database
    const user = await User.findById(payload.sub);
    if (!user) {
      return sendError(res, 'User not found. Invalid session', 401);
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendError(res, 'Token expired. Please login again', 401);
    }
    return sendError(res, 'Invalid or expired token', 401);
  }
}
