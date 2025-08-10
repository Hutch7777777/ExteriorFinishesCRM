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
      // Remove password hash before returning user data
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

  router.post('/auth.register', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('admin')(ctx);
      
      const inputData = req.body?.input || {};
      const input = insertUserSchema.omit({ id: true, createdAt: true }).parse(inputData);
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
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr', 'all']).optional(),
        q: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
      });
      
      const input = inputSchema.parse(req.query);
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      
      const result = await storage.getCustomers(scopedDivisionId);
      
      // Apply text search filter if provided
      const filteredResult = input.q 
        ? result.filter(customer => 
            customer.name.toLowerCase().includes(input.q!.toLowerCase()) ||
            customer.email?.toLowerCase().includes(input.q!.toLowerCase()) ||
            customer.phone?.includes(input.q!)
          )
        : result;
      
      // Simple pagination
      const pageSize = 20;
      const startIndex = (input.page - 1) * pageSize;
      const paginatedResult = filteredResult.slice(startIndex, startIndex + pageSize);
      
      res.json({ result: superjson.serialize(paginatedResult) });
    } catch (error) {
      console.error('Error in customers.list:', error);
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
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr']),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        addressJson: z.any().optional(),
        notes: z.string().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Get division by key and enforce scoping
      const division = await storage.getDivisionByKey(input.divisionKey);
      if (!division) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Division not found' });
      }
      
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      if (scopedDivisionId !== division.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
      }
      
      const customerData = {
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        addressJson: input.addressJson || null,
        notes: input.notes || null,
        divisionId: division.id,
      };
      
      const result = await storage.createCustomer(customerData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.get('/customers.getById', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('staff')(ctx);
      
      const input = z.object({ id: z.string().uuid() }).parse(req.query);
      const result = await storage.getCustomer(input.id);
      
      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/customers.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        addressJson: z.any().optional(),
        notes: z.string().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify customer exists and user has access
      const existing = await storage.getCustomer(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }
      
      // Check division access
      if (existing.divisionId) {
        const division = await storage.getDivision(existing.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      const updateData = {
        ...(input.name && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.addressJson !== undefined && { addressJson: input.addressJson }),
        ...(input.notes !== undefined && { notes: input.notes }),
      };
      
      const result = await storage.updateCustomer(input.id, updateData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Jobs endpoints
  router.get('/jobs.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr', 'all']).optional(),
        status: z.enum(['draft', 'active', 'closed', 'planning', 'in_progress', 'completed']).optional(),
        page: z.coerce.number().min(1).default(1),
      });
      
      const input = inputSchema.parse(req.query);
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      
      const result = await storage.getJobs(scopedDivisionId);
      
      // Filter by status if provided
      const filteredResult = input.status 
        ? result.filter(job => job.status === input.status)
        : result;
      
      // Simple pagination (would implement proper offset/limit in real app)
      const pageSize = 20;
      const startIndex = (input.page - 1) * pageSize;
      const paginatedResult = filteredResult.slice(startIndex, startIndex + pageSize);
      
      res.json({ result: superjson.serialize(paginatedResult) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/jobs.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        customerId: z.string().uuid(),
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr']),
        status: z.enum(['draft', 'active', 'closed', 'planning', 'in_progress', 'completed']).default('draft'),
        siteAddressJson: z.any().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Get division and enforce scoping
      const division = await storage.getDivisionByKey(input.divisionKey);
      if (!division) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Division not found' });
      }
      
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      if (scopedDivisionId !== division.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
      }
      
      // Verify customer exists and belongs to same division
      const customer = await storage.getCustomer(input.customerId);
      if (!customer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }
      if (customer.divisionId !== division.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Customer not in specified division' });
      }
      
      const jobData = {
        customerId: input.customerId,
        divisionId: division.id,
        status: input.status,
        siteAddressJson: input.siteAddressJson || null,
        createdBy: user.id,
      };
      
      const result = await storage.createJob(jobData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/jobs.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        status: z.enum(['draft', 'active', 'closed', 'planning', 'in_progress', 'completed']).optional(),
        siteAddressJson: z.any().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify job exists and user has access
      const existing = await storage.getJob(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }
      
      // Check division access
      if (existing.divisionId) {
        const division = await storage.getDivision(existing.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      const updateData = {
        ...(input.status && { status: input.status }),
        ...(input.siteAddressJson !== undefined && { siteAddressJson: input.siteAddressJson }),
      };
      
      const result = await storage.updateJob(input.id, updateData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Estimates endpoints
  router.get('/estimates.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr', 'all']).optional(),
        status: z.enum(['draft', 'sent', 'approved', 'rejected']).optional(),
        page: z.coerce.number().min(1).default(1),
      });
      
      const input = inputSchema.parse(req.query);
      
      // Get estimates with division filtering
      let result = await storage.getEstimates();
      
      // Filter by division if user is staff or division specified (but not "all")
      if ((input.divisionKey && input.divisionKey !== 'all') || user.role === 'staff') {
        const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
        if (scopedDivisionId) {
          result = result.filter(estimate => {
            return estimate.job?.divisionId === scopedDivisionId;
          });
        }
      }
      
      // Filter by status if provided
      if (input.status) {
        result = result.filter(estimate => estimate.status === input.status);
      }
      
      // Simple pagination
      const pageSize = 20;
      const startIndex = (input.page - 1) * pageSize;
      const paginatedResult = result.slice(startIndex, startIndex + pageSize);
      
      res.json({ result: superjson.serialize(paginatedResult) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/estimates.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        jobId: z.string().uuid(),
        status: z.enum(['draft', 'sent', 'approved', 'rejected']).default('draft'),
        totalCents: z.number().min(0),
        linesJson: z.any(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify job exists and user has access
      const job = await storage.getJob(input.jobId);
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }
      
      // Check division access
      if (job.divisionId) {
        const division = await storage.getDivision(job.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      const estimateData = {
        jobId: input.jobId,
        status: input.status,
        totalCents: input.totalCents,
        linesJson: input.linesJson,
      };
      
      const result = await storage.createEstimate(estimateData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/estimates.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        status: z.enum(['draft', 'sent', 'approved', 'rejected']).optional(),
        totalCents: z.number().min(0).optional(),
        linesJson: z.any().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify estimate exists and user has access
      const existing = await storage.getEstimate(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Estimate not found' });
      }
      
      // Check division access through job
      if (existing.job?.divisionId) {
        const division = await storage.getDivision(existing.job.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      const updateData = {
        ...(input.status && { status: input.status }),
        ...(input.totalCents !== undefined && { totalCents: input.totalCents }),
        ...(input.linesJson !== undefined && { linesJson: input.linesJson }),
      };
      
      const result = await storage.updateEstimate(input.id, updateData);
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