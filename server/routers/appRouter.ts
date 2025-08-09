import { z } from 'zod';
import { Router } from 'express';
import { createContext, requireAuthed, requireRole, getDivisionScope, TRPCError, type TRPCContext } from '../trpc';
import { storage } from '../storage';
import superjson from 'superjson';
import { 
  insertCustomerSchema, 
  insertJobSchema, 
  insertEstimateSchema,
  insertUserSchema 
} from '@shared/schema';

// Custom tRPC-like router implementation
export const createAppRouter = () => {
  const router = Router();

  // Health check endpoint
  router.get('/health.check', (req, res) => {
    try {
      const result = { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      res.status(500).json({ error: { message: 'Internal server error' } });
    }
  });

  // Auth endpoints
  router.get('/auth.me', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireAuthed(ctx);
      const result = { user };
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/auth.register', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('admin')(ctx);
      
      const input = insertUserSchema.omit({ id: true, createdAt: true }).parse(req.body?.input || {});
      const user = await storage.createUser(input);
      const { passwordHash, ...userWithoutPassword } = user;
      const result = { user: userWithoutPassword };
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Customers endpoints
  router.get('/customers.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const input = z.object({ divisionKey: z.string().optional() }).parse(req.query);
      const divisionId = getDivisionScope(user, input.divisionKey);
      const result = await storage.getCustomers(divisionId);
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.get('/customers.get', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('staff')(ctx);
      
      const input = z.object({ id: z.string().uuid() }).parse(req.query);
      const result = await storage.getCustomer(input.id);
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/customers.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('staff')(ctx);
      
      const input = insertCustomerSchema.omit({ id: true, createdAt: true }).parse(req.body?.input || {});
      const result = await storage.createCustomer(input);
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Divisions endpoints
  router.get('/divisions.getAll', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('staff')(ctx);
      
      const result = await storage.getDivisions();
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.get('/divisions.getByKey', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('staff')(ctx);
      
      const input = z.object({ key: z.enum(['mfnc', 'sfnc', 'rr']) }).parse(req.query);
      const result = await storage.getDivisionByKey(input.key);
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  return router;
};

// Export the router creator
export const appRouter = createAppRouter;