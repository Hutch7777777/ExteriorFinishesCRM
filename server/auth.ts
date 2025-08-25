import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { storage } from './storage';
import type { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = '24h'; // Extended for better user experience

// Encryption secret for encrypting/decrypting JWT tokens in cookies
const ENCRYPTION_SECRET = process.env.COOKIE_ENCRYPTION_SECRET || 'your-fallback-encryption-secret-key'; // Must be 32 bytes for AES-256
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Encrypt token for cookie storage
export function encryptToken(token: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt token from cookie storage
export function decryptToken(encryptedToken: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
  
  const parts = encryptedToken.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid token format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Auth middleware
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const encToken = req.cookies?.access_token;

  if (!encToken) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  let token: string;
  try {
    token = decryptToken(encToken);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token format' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  try {
    const user = await storage.getUser(payload.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Admin-only middleware
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
}

// Set auth cookie
export function setAuthCookie(res: Response, token: string): void {
  const encryptedToken = encryptToken(token);
  res.cookie('access_token', encryptedToken, {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds to match JWT
    path: '/',
  });
}

// Clear auth cookie
export function clearAuthCookie(res: Response): void {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
}