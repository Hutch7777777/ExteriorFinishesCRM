import superjson from 'superjson';
import { verifyToken } from './auth';
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
  const token = req.cookies?.access_token;
  
  if (!token) {
    return { user: null, req, res };
  }

  try {
    const payload = verifyToken(token);
    if (!payload) {
      return { user: null, req, res };
    }

    const user = await storage.getUser(payload.userId);
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
    // Admin can specify division by key - need to look up the UUID
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