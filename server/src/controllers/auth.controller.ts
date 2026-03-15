import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('Register request body:', req.body); // Debug log
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email and password are required', 400);
    }

    const result = await authService.register(name, email, password);
    sendSuccess(res, result, 'User registered successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function validateSession(req: Request, res: Response, next: NextFunction) {
  try {
    // If we reached here, the requireAuth middleware already validated the token and user
    const user = req.user;
    if (!user) {
      return sendError(res, 'Session invalid', 401);
    }

    sendSuccess(
      res,
      {
        id: user.sub,
        email: user.email,
        token: req.headers.authorization?.slice(7) || '',
      },
      'Session is valid',
    );
  } catch (err) {
    next(err);
  }
}
