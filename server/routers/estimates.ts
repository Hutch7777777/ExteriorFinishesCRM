import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { Router } from 'express';
import { createContext, requireAuthed, TRPCError } from '../trpc';
import { storage } from '../storage';
import superjson from 'superjson';
import { insertEstimateSchema } from '@shared/schema';

export const addEstimatesRoutes = (router: Router) => {
  // List all estimates
  router.get('/estimates.list', async (req, res) => {
    try {
      const ctx = await createContext(req, res);
      requireAuthed(ctx);
      
      const estimates = await storage.getEstimates();
      res.json({ result: superjson.serialize(estimates) });
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('Estimates list error:', error);
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });

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
    console.log('🚀 Starting estimate creation...');
    console.log('📨 Raw request body:', JSON.stringify(req.body, null, 2));
    
    try {
      console.log('🔐 Creating context...');
      const ctx = await createContext(req, res);
      console.log('🔐 Context created, checking auth...');
      const user = requireAuthed(ctx);
      console.log('✅ User authenticated:', JSON.stringify(user, null, 2));
      
      const input = req.body.input;
      console.log('📝 Received estimate create input:', JSON.stringify(input, null, 2));
      
      if (!input) {
        return res.status(400).json({ error: { message: 'Input is required' } });
      }

      // Set estimatedBy to current user (required field)
      const estimateData = {
        ...input,
        estimatedBy: user.id, // Always use the authenticated user's ID
      };

      console.log('🔍 Prepared estimate data:', JSON.stringify(estimateData, null, 2));

      // Check if lead exists before creating estimate
      const existingLead = await storage.getLead(estimateData.leadId);
      if (!existingLead) {
        console.error('❌ Lead not found:', estimateData.leadId);
        return res.status(400).json({ error: { message: 'Selected lead does not exist' } });
      }

      // Validate input with schema
      const validatedInput = insertEstimateSchema.parse(estimateData);
      console.log('✅ Validated estimate input:', JSON.stringify(validatedInput, null, 2));

      const newEstimate = await storage.createEstimate(validatedInput);
      console.log('🎉 Created estimate:', JSON.stringify(newEstimate, null, 2));
      
      res.json({ result: superjson.serialize(newEstimate) });
    } catch (error) {
      if (error instanceof TRPCError) {
        console.error('❌ TRPCError in estimates.create:', error);
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        console.error('❌ Estimates create error:', error);
        console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
        console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        res.status(500).json({ error: { message: 'Internal server error', details: error instanceof Error ? error.message : String(error) } });
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