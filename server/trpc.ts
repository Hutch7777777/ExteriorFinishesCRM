import superjson from 'superjson';
import { verifyToken, decryptToken } from './auth';
import { storage } from './storage';
import type { User } from '@shared/schema';
import type { Request, Response } from 'express';

// Custom tRPC-like implementation without external dependencies
export interface TRPCContext {
  user: User | null;
  req: Request;
  res: Response;
}

// Create context function - extracts user from JWT if present
export const createContext = async (req: Request, res: Response): Promise<TRPCContext> => {
  console.log('🍪 All cookies:', JSON.stringify(req.cookies, null, 2));
  const encryptedToken = req.cookies?.session;
  console.log('🔑 Session token from cookies:', encryptedToken ? 'Found' : 'Not found');
  
  if (!encryptedToken) {
    console.log('❌ No session token found in cookies');
    return { user: null, req, res };
  }

  try {
    // First decrypt the token, then verify it
    const token = decryptToken(encryptedToken);
    const payload = verifyToken(token);
    if (!payload) {
      console.log('❌ Invalid token payload');
      return { user: null, req, res };
    }

    const user = await storage.getUser(payload.userId);
    console.log('✅ User authenticated via TRPC:', user?.email);
    return { user: user || null, req, res };
  } catch (error) {
    console.error('Error creating tRPC context:', error);
    return { user: null, req, res };
  }
};

// Custom error types
export class TRPCError extends Error {
  public code: string;
  public statusCode: number;

  constructor({ code, message }: { code: string; message: string }) {
    super(message);
    this.code = code;
    this.statusCode = this.getStatusCode(code);
  }

  private getStatusCode(code: string): number {
    switch (code) {
      case 'UNAUTHORIZED': return 401;
      case 'FORBIDDEN': return 403;
      case 'NOT_FOUND': return 404;
      case 'BAD_REQUEST': return 400;
      case 'INTERNAL_SERVER_ERROR': return 500;
      default: return 500;
    }
  }
}

// Authentication middleware helpers
export const requireAuthed = (ctx: TRPCContext) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  return ctx.user;
};

export const requireRole = (role: 'admin' | 'staff') => {
  return (ctx: TRPCContext) => {
    const user = requireAuthed(ctx);
    
    if (user.role !== role && !(role === 'staff' && user.role === 'admin')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `${role} access required`,
      });
    }
    
    return user;
  };
};

// Division scoping helper
export const getDivisionScope = async (user: User, requestedDivisionKey?: string): Promise<string | undefined> => {
  if (user.role === 'staff') {
    // Staff users are forced to use their assigned division
    if (!user.divisionId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Staff user has no assigned division',
      });
    }
    return user.divisionId;
  }

  if (user.role === 'admin') {
    // Admin can view all divisions or specify a specific division
    if (requestedDivisionKey === 'all') {
      return undefined; // undefined means no filtering, show all divisions
    }
    
    if (requestedDivisionKey) {
      const division = await storage.getDivisionByKey(requestedDivisionKey as 'mfnc' | 'sfnc' | 'rr');
      if (!division) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Division with key '${requestedDivisionKey}' not found`,
        });
      }
      return division.id;
    }
    return user.divisionId || undefined;
  }

  return undefined;
};