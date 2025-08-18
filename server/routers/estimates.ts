import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { Router } from 'express';
import { createContext, requireAuthed, TRPCError } from '../trpc';
import { storage } from '../storage';
import superjson from 'superjson';
import { insertEstimateSchema } from '@shared/schema';

export const addEstimatesRoutes = (router: Router) => {
  // Get estimates for a lead
  router.post('/estimates.getByLeadId', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireAuthed(ctx);
      
      const input = req.body.input;
      if (!input || !input.leadId) {
        return res.status(400).json({ error: { message: 'leadId is required' } });
      }

      const estimates = await storage.getEstimatesByLeadId(input.leadId);
      res.json({ result: superjson.serialize(estimates) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('Estimates getByLeadId error:', error);
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Get single estimate
  router.post('/estimates.get', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireAuthed(ctx);
      
      const input = req.body.input;
      if (!input || !input.id) {
        return res.status(400).json({ error: { message: 'id is required' } });
      }

      const estimate = await storage.getEstimate(input.id);
      if (!estimate) {
        return res.status(404).json({ error: { message: 'Estimate not found' } });
      }

      res.json({ result: superjson.serialize(estimate) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('Estimates get error:', error);
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Create estimate
  router.post('/estimates.create', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      const user = requireAuthed(ctx);
      
      const input = req.body.input;
      if (!input) {
        return res.status(400).json({ error: { message: 'Input is required' } });
      }

      // Validate input with schema
      const validatedInput = insertEstimateSchema.parse(input);
      
      // Set estimatedBy to current user if not provided
      const estimateData = {
        ...validatedInput,
        estimatedBy: validatedInput.estimatedBy || user.id,
      };

      const newEstimate = await storage.createEstimate(estimateData);
      res.json({ result: superjson.serialize(newEstimate) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('Estimates create error:', error);
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Update estimate
  router.post('/estimates.update', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireAuthed(ctx);
      
      const input = req.body.input;
      if (!input || !input.id) {
        return res.status(400).json({ error: { message: 'id is required' } });
      }

      const updatedEstimate = await storage.updateEstimate(input.id, input);
      res.json({ result: superjson.serialize(updatedEstimate) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('Estimates update error:', error);
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

  // Delete estimate
  router.post('/estimates.delete', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireAuthed(ctx);
      
      const input = req.body.input;
      if (!input || !input.id) {
        return res.status(400).json({ error: { message: 'id is required' } });
      }

      await storage.deleteEstimate(input.id);
      res.json({ result: superjson.serialize({ success: true }) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('Estimates delete error:', error);
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });
};