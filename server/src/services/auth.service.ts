import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/response';

export const authService = {
  async register(name: string, email: string, password: string) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const user = await userRepository.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
    });

    const token = this.generateToken(user._id, user.email, user.name);
    return { user: { id: user._id, name: user.name, email: user.email }, token };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user._id.toString(), user.email, user.name);
    return { user: { id: user._id.toString(), name: user.name, email: user.email }, token };
  },

  generateToken(userId: string, email: string, name?: string): string {
    return jwt.sign({ sub: userId, email, name }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
  },

  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as {
        sub: string;
        email: string;
      };
    } catch {
      return null;
    }
  },
};
