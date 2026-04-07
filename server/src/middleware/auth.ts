import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { useInMemoryDB, findUserById } from '../store.js';

dotenv.config();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'teacher' | 'student';
  };
  headers: Record<string, string | string[] | undefined>;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token =
      typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = useInMemoryDB
      ? await findUserById(decoded.id)
      : await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: useInMemoryDB ? (user as any).id : (user as any)._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const generateToken = (userId: string): string => {
  const secret: Secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn } as any);
};
