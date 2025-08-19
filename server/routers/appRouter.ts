import { z } from 'zod';
import { Router } from 'express';
import { createContext, requireAuthed, requireRole, getDivisionScope, TRPCError, type TRPCContext } from '../trpc';
import { storage } from '../storage';
import superjson from 'superjson';
import { 
  insertCustomerSchema, 
  insertJobSchema, 
  insertEstimateSchema,
  insertProposalSchema,
  insertUserSchema,
  insertLeadSchema,
  insertContactSchema
} from '@shared/schema';
import { addEstimatesRoutes } from './estimates';

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

  // Leads endpoints
  router.get('/leads.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr', 'all']).optional(),
        status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
        page: z.coerce.number().min(1).default(1),
      });
      
      const input = inputSchema.parse(req.query);
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      
      const result = await storage.getLeads(scopedDivisionId);
      
      // Filter by status if provided
      const filteredResult = input.status 
        ? result.filter(lead => lead.status === input.status)
        : result;
      
      // Simple pagination
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

  router.get('/leads.get', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('staff')(ctx);
      
      const input = z.object({ id: z.string().uuid() }).parse(req.query);
      const result = await storage.getLead(input.id);
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/leads.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr']),
        name: z.string().min(1),
        contact: z.string().min(1),
        email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
        phone: z.string().optional().or(z.literal('').transform(() => undefined)),
        address: z.string().optional().or(z.literal('').transform(() => undefined)),
        status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
        value: z.number().optional(),
        source: z.string().optional().or(z.literal('').transform(() => undefined)),
        projectType: z.string().optional().or(z.literal('').transform(() => undefined)),
        timeline: z.string().optional().or(z.literal('').transform(() => undefined)),
        budget: z.string().optional().or(z.literal('').transform(() => undefined)),
        assignedTo: z.any().optional(),
        notes: z.any().optional(),
      });
      
      // Preprocess input to handle null values
      const rawInput = req.body?.input || {};
      const processedInput = {
        ...rawInput,
        assignedTo: rawInput.assignedTo === null ? undefined : rawInput.assignedTo,
        notes: rawInput.notes === null ? undefined : rawInput.notes,
      };
      
      const input = inputSchema.parse(processedInput);
      
      // Get division by key and enforce scoping
      const division = await storage.getDivisionByKey(input.divisionKey);
      if (!division) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Division not found' });
      }
      
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      if (scopedDivisionId !== division.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
      }
      
      const leadData = {
        name: input.name,
        contact: input.contact,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        status: input.status,
        value: input.value ? Math.round(input.value * 100) : 0, // Convert to cents
        source: input.source || null,
        projectType: input.projectType || null,
        timeline: input.timeline || null,
        budget: input.budget || null,
        assignedTo: input.assignedTo || null,
        notes: input.notes || null,
        divisionId: division.id,
        createdBy: user.id,
      };
      
      const result = await storage.createLead(leadData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      console.error('Error in leads.create endpoint:', error);
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error', details: error.message } });
      }
    }
  });

  router.post('/leads.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        contact: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
        value: z.number().optional(),
        source: z.string().optional(),
        projectType: z.string().optional(),
        timeline: z.string().optional(),
        budget: z.string().optional(),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify lead exists and user has access
      const existing = await storage.getLead(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
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
        ...(input.contact && { contact: input.contact }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.status && { status: input.status }),
        ...(input.value !== undefined && { value: input.value ? Math.round(input.value * 100) : 0 }),
        ...(input.source !== undefined && { source: input.source }),
        ...(input.projectType !== undefined && { projectType: input.projectType }),
        ...(input.timeline !== undefined && { timeline: input.timeline }),
        ...(input.budget !== undefined && { budget: input.budget }),
        ...(input.assignedTo !== undefined && { assignedTo: input.assignedTo }),
        ...(input.notes !== undefined && { notes: input.notes }),
      };
      
      const result = await storage.updateLead(input.id, updateData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/leads.updateStatus', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify lead exists and user has access
      const existing = await storage.getLead(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
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
      
      const result = await storage.updateLead(input.id, { status: input.status });
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/leads.delete', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify lead exists and user has access
      const existing = await storage.getLead(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
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
      
      await storage.deleteLead(input.id);
      res.json({ result: superjson.serialize({ success: true }) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/leads.addNote', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        text: z.string().min(1),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify lead exists and user has access
      const existing = await storage.getLead(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
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
      
      // Get current notes array
      const currentNotes = Array.isArray(existing.notes) ? existing.notes : [];
      
      // Create new note object
      const newNote = {
        id: Date.now().toString(),
        text: input.text,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        author: user.name,
      };
      
      // Add new note to the beginning of the array
      const updatedNotes = [newNote, ...currentNotes];
      
      const result = await storage.updateLead(input.id, { notes: updatedNotes });
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Contacts endpoints
  router.get('/contacts.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr', 'all']).optional(),
        type: z.enum(['vendor', 'subcontractor', 'supplier', 'internal', 'partner']).optional(),
        page: z.coerce.number().min(1).default(1),
      });
      
      const input = inputSchema.parse(req.query);
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      
      const result = await storage.getContacts(scopedDivisionId);
      
      // Filter by type if provided
      const filteredResult = input.type 
        ? result.filter(contact => contact.type === input.type)
        : result;
      
      // Simple pagination
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

  router.get('/contacts.get', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireRole('staff')(ctx);
      
      const input = z.object({ id: z.string().uuid() }).parse(req.query);
      const result = await storage.getContact(input.id);
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/contacts.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = insertContactSchema.extend({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr']),
      }).omit({ divisionId: true, createdBy: true });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Get division scope
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      if (!scopedDivisionId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid division' });
      }
      
      // Create contact with proper division and user association
      const contactData = {
        ...input,
        divisionId: scopedDivisionId,
        createdBy: user.id,
      };
      
      const result = await storage.createContact(contactData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('Contact creation error:', error);
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/contacts.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        company: z.string().min(1).optional(),
        type: z.enum(['vendor', 'subcontractor', 'supplier', 'internal', 'partner']).optional(),
        email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
        phone: z.string().optional().or(z.literal('').transform(() => undefined)),
        address: z.string().optional().or(z.literal('').transform(() => undefined)),
        specialty: z.string().optional().or(z.literal('').transform(() => undefined)),
        rating: z.number().min(0).max(5).optional(),
        notes: z.string().optional().or(z.literal('').transform(() => undefined)),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify contact exists and user has access
      const existing = await storage.getContact(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
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
      
      const { id, ...updateData } = input;
      const result = await storage.updateContact(id, updateData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/contacts.delete', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify contact exists and user has access
      const existing = await storage.getContact(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
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
      
      await storage.deleteContact(input.id);
      res.json({ result: superjson.serialize({ success: true }) });
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
      
      console.log('🚀 AppRouter - Creating estimate with data:', JSON.stringify(req.body, null, 2));
      
      const inputSchema = z.object({
        leadId: z.string().uuid().optional(),
        jobId: z.string().uuid().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(['draft', 'sent', 'approved', 'rejected']).default('draft'),
        totalCents: z.number().min(0).default(0),
        laborHours: z.string().default('0'),
        materialCosts: z.number().default(0),
        equipmentCosts: z.number().default(0),
        overheadPercentage: z.string().default('15'),
        profitMarginPercentage: z.string().default('20'),
        linesJson: z.any().optional(),
        notes: z.string().optional(),
        estimatorId: z.string().uuid().optional(),
        importData: z.string().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify lead exists if provided
      if (input.leadId) {
        const lead = await storage.getLead(input.leadId);
        if (!lead) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
        }
      }
      
      // Verify job exists if provided  
      if (input.jobId) {
        const job = await storage.getJob(input.jobId);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }
      }
      
      const estimateData = {
        leadId: input.leadId,
        jobId: input.jobId,
        title: input.title,
        description: input.description,
        status: input.status,
        totalCents: input.totalCents,
        laborHours: input.laborHours,
        materialCosts: input.materialCosts,
        equipmentCosts: input.equipmentCosts,
        overheadPercentage: input.overheadPercentage,
        profitMarginPercentage: input.profitMarginPercentage,
        linesJson: input.linesJson,
        notes: input.notes,
        estimatorId: input.estimatorId,
        importData: input.importData,
        estimatedBy: user.id,
      };
      
      console.log('💾 AppRouter - Calling storage.createEstimate with:', JSON.stringify(estimateData, null, 2));
      const result = await storage.createEstimate(estimateData);
      console.log('✅ AppRouter - Estimate created successfully:', result.id);
      
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      console.error('❌ AppRouter - Error creating estimate:', error);
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error', details: error.message } });
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

  // Proposals endpoints
  router.get('/proposals.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr', 'all']).optional(),
        status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
        page: z.coerce.number().min(1).default(1),
      });
      
      const input = inputSchema.parse(req.query);
      
      // Get proposals with division filtering
      let result = await storage.getProposals();
      
      // Filter by division if user is staff or division specified (but not "all")
      if ((input.divisionKey && input.divisionKey !== 'all') || user.role === 'staff') {
        const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
        if (scopedDivisionId) {
          result = result.filter(proposal => proposal.divisionId === scopedDivisionId);
        }
      }
      
      // Filter by status if provided
      if (input.status) {
        result = result.filter(proposal => proposal.status === input.status);
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

  router.post('/proposals.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = insertProposalSchema.extend({
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr']).optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Get the division ID from the division key or user's division
      const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
      if (!scopedDivisionId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to division' });
      }
      
      // Verify customer exists and user has access to it
      const customer = await storage.getCustomer(input.customerId);
      if (!customer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }
      
      if (customer.divisionId !== scopedDivisionId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer not accessible in this division' });
      }
      
      const proposalData = {
        ...input,
        divisionId: scopedDivisionId,
        createdBy: user.id,
      };
      
      // Remove divisionKey from the data as it's not part of the schema
      const { divisionKey, ...finalProposalData } = proposalData;
      
      const result = await storage.createProposal(finalProposalData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/proposals.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
      }).merge(insertProposalSchema.partial());
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify proposal exists and user has access
      const existing = await storage.getProposal(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
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
      
      const { id, ...updateData } = input;
      const result = await storage.updateProposal(id, updateData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.get('/proposals.getById', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const input = z.object({ id: z.string().uuid() }).parse(req.query);
      const result = await storage.getProposal(input.id);
      
      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }
      
      // Check division access
      if (result.divisionId) {
        const division = await storage.getDivision(result.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
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

  // Field Management endpoints
  router.get('/fieldLogs.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        jobId: z.string().uuid(),
        divisionKey: z.enum(['mfnc', 'sfnc', 'rr']).optional(),
      });
      
      const input = inputSchema.parse(req.query);
      
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
      
      const result = await storage.getFieldLogs(input.jobId);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/fieldLogs.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        jobId: z.string().uuid(),
        logType: z.enum(['progress', 'issue', 'completion', 'weather', 'safety']).default('progress'),
        title: z.string().min(1),
        description: z.string().min(1),
        weatherConditions: z.string().optional(),
        crewMembers: z.any().default([]),
        hoursWorked: z.number().optional(),
        photosJson: z.any().default([]),
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
      
      const logData = {
        jobId: input.jobId,
        createdBy: user.id,
        logType: input.logType,
        title: input.title,
        description: input.description,
        weatherConditions: input.weatherConditions || null,
        crewMembers: input.crewMembers || [],
        hoursWorked: input.hoursWorked || null,
        photosJson: input.photosJson || [],
      };
      
      const result = await storage.createFieldLog(logData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.get('/punchListItems.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        jobId: z.string().uuid(),
        status: z.enum(['open', 'in_progress', 'completed', 'verified']).optional(),
      });
      
      const input = inputSchema.parse(req.query);
      
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
      
      let result = await storage.getPunchListItems(input.jobId);
      
      // Filter by status if provided
      if (input.status) {
        result = result.filter(item => item.status === input.status);
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

  router.post('/punchListItems.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        jobId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().min(1),
        location: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        assignedTo: z.string().uuid().optional(),
        dueDate: z.coerce.date().optional(),
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
      
      const itemData = {
        jobId: input.jobId,
        createdBy: user.id,
        assignedTo: input.assignedTo || null,
        title: input.title,
        description: input.description,
        location: input.location || null,
        priority: input.priority,
        status: 'open' as const,
        dueDate: input.dueDate || null,
        photosJson: [],
        notesJson: [],
      };
      
      const result = await storage.createPunchListItem(itemData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/punchListItems.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
        status: z.enum(['open', 'in_progress', 'completed', 'verified']).optional(),
        assignedTo: z.string().uuid().optional(),
        dueDate: z.coerce.date().optional(),
        photosJson: z.any().optional(),
        notesJson: z.any().optional(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify punch list item exists and user has access
      const existing = await storage.getPunchListItem(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Punch list item not found' });
      }
      
      // Verify job access
      const job = await storage.getJob(existing.jobId);
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Associated job not found' });
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
      
      const updateData: any = {
        ...(input.status && { status: input.status }),
        ...(input.assignedTo !== undefined && { assignedTo: input.assignedTo }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.photosJson !== undefined && { photosJson: input.photosJson }),
        ...(input.notesJson !== undefined && { notesJson: input.notesJson }),
      };
      
      // If marking as completed, set completion details
      if (input.status === 'completed') {
        updateData.completedAt = new Date();
        updateData.completedBy = user.id;
      }
      
      const result = await storage.updatePunchListItem(input.id, updateData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Documents endpoints
  router.get('/documents.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        leadId: z.string().uuid(),
      });
      
      const input = inputSchema.parse(req.query);
      
      // Verify lead exists and user has access
      const lead = await storage.getLead(input.leadId);
      if (!lead) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
      }
      
      // Check division access
      if (lead.divisionId) {
        const division = await storage.getDivision(lead.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      const result = await storage.listDocuments(input.leadId);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/documents.getByLeadId', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        leadId: z.string().uuid(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify lead exists and user has access
      const lead = await storage.getLead(input.leadId);
      if (!lead) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
      }
      
      // Check division access
      if (lead.divisionId) {
        const division = await storage.getDivision(lead.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      const result = await storage.listDocuments(input.leadId);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  router.post('/documents.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        leadId: z.string().uuid(),
        filename: z.string(),
        originalFilename: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        objectPath: z.string(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      
      // Verify lead exists and user has access
      const lead = await storage.getLead(input.leadId);
      if (!lead) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
      }
      
      // Check division access
      if (lead.divisionId) {
        const division = await storage.getDivision(lead.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      const documentData = {
        leadId: input.leadId,
        filename: input.filename,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        objectPath: input.objectPath,
        uploadedBy: user.id,
      };
      
      const result = await storage.createDocument(documentData);
      res.json({ result: superjson.serialize(result) });
    } catch (error) {
      console.error('Error in documents.create endpoint:', error);
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error', details: error.message } });
      }
    }
  });

  // POST version for frontend compatibility
  router.post('/documents.delete', async (req, res) => {
    try {
      console.log('🗑️ Documents delete POST request received:', req.body);
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
      });
      
      const input = inputSchema.parse(req.body?.input || {});
      console.log('🔍 Parsed delete input:', input);
      
      // Verify document exists and user has access
      const document = await storage.getDocument(input.id);
      if (!document) {
        console.log('❌ Document not found:', input.id);
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }
      console.log('📄 Found document:', document);
      
      // Verify lead access
      const lead = await storage.getLead(document.leadId);
      if (!lead) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Associated lead not found' });
      }
      
      // Check division access
      if (lead.divisionId) {
        const division = await storage.getDivision(lead.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      console.log('🗑️ Attempting to delete document:', input.id);
      await storage.deleteDocument(input.id);
      console.log('✅ Document deleted successfully:', input.id);
      
      res.json({ result: superjson.serialize({ success: true }) });
    } catch (error) {
      console.error('❌ Error in documents.delete POST:', error);
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // DELETE version (keeping for completeness)
  router.delete('/documents.delete', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireRole('staff')(ctx);
      
      const inputSchema = z.object({
        id: z.string().uuid(),
      });
      
      const input = inputSchema.parse(req.query);
      
      // Verify document exists and user has access
      const document = await storage.getDocument(input.id);
      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }
      
      // Verify lead access
      const lead = await storage.getLead(document.leadId);
      if (!lead) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Associated lead not found' });
      }
      
      // Check division access
      if (lead.divisionId) {
        const division = await storage.getDivision(lead.divisionId);
        if (division) {
          const scopedDivisionId = await getDivisionScope(user, division.key);
          if (scopedDivisionId !== division.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this division' });
          }
        }
      }
      
      await storage.deleteDocument(input.id);
      res.json({ result: superjson.serialize({ success: true }) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Add estimates routes
  addEstimatesRoutes(router);

  return router;
};

// Export the router creator
export const appRouter = createAppRouter;