import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import authRoutes from "./authRoutes";
import { authenticateToken } from "./auth";
import type { AuthenticatedRequest } from "./auth";
import { appRouter } from "./routers/appRouter";
import { 
  insertDivisionSchema,
  insertCustomerSchema,
  insertJobSchema,
  insertEstimateSchema,
} from "@shared/schema";
import Anthropic from '@anthropic-ai/sdk';
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT Auth routes
  app.use('/api/auth', authRoutes);

  // Custom tRPC-like API routes
  app.use('/api/trpc', appRouter());

  // Replit Auth middleware (keep for future compatibility)
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      console.log("User object from session:", req.user);
      
      // Get user ID from different possible sources
      let userId = null;
      if (req.user?.claims?.sub) {
        // Convert Replit user ID to UUID format like we do in upsertUser
        const crypto = await import('crypto');
        const userIdHash = crypto.createHash('sha256').update(req.user.claims.sub).digest('hex');
        userId = [
          userIdHash.substring(0, 8),
          userIdHash.substring(8, 12),
          userIdHash.substring(12, 16),
          userIdHash.substring(16, 20),
          userIdHash.substring(20, 32)
        ].join('-');
      } else if (req.user?.id) {
        userId = req.user.id;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found in database" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/recent-jobs', isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getRecentJobs(5);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      res.status(500).json({ message: "Failed to fetch recent jobs" });
    }
  });

  app.get('/api/dashboard/recent-activity', isAuthenticated, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity(5);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Object Storage Routes for Document Upload
  app.post('/api/objects/upload', authenticateToken, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve uploaded documents
  app.get('/objects/:objectPath(*)', authenticateToken, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectFile(`${objectStorageService.getPrivateObjectDir()}/uploads/${req.params.objectPath}`);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Error serving file" });
    }
  });

  // Business Insight API - Claude AI integration
  app.post('/api/business-insight/generate', authenticateToken, async (req: any, res) => {
    try {
      const { prompt, division, context } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      // Create a comprehensive context-aware prompt for Claude
      const enhancedPrompt = `You are a business intelligence assistant for Exterior Finishes, a professional siding contractor in Seattle, Washington. 

Business Context:
- Company: Exterior Finishes (siding contractor)
- Location: Seattle, Washington market
- Current Division: ${division || 'Multi-Family'}
- Customer Count: ${context?.customerCount || 0}
- Estimate Count: ${context?.estimateCount || 0}

You have expertise in:
- Seattle construction and siding market analysis
- Residential and commercial exterior finishing
- Competition analysis for siding contractors
- Market trends and pricing strategies
- Lead generation and customer acquisition
- Project management and operational efficiency

User Request: ${prompt}

Please provide a comprehensive, actionable response that:
1. Addresses the specific request with market-relevant insights
2. Includes concrete recommendations for Exterior Finishes
3. References Seattle market conditions when relevant
4. Provides data-driven insights when possible
5. Maintains a professional, consultative tone

Format your response in clear sections with actionable insights.`;

      // Generate response using Claude
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ]
      });

      const insight = response.content[0]?.type === 'text' ? response.content[0].text : 'I apologize, but I was unable to generate insights at this time.';

      // Determine report type based on prompt content
      let reportType = 'general';
      if (prompt.toLowerCase().includes('competitor') || prompt.toLowerCase().includes('competition')) {
        reportType = 'competition';
      } else if (prompt.toLowerCase().includes('market') || prompt.toLowerCase().includes('trend')) {
        reportType = 'market_analysis';
      } else if (prompt.toLowerCase().includes('lead') || prompt.toLowerCase().includes('customer')) {
        reportType = 'customer_insights';
      } else if (prompt.toLowerCase().includes('price') || prompt.toLowerCase().includes('cost')) {
        reportType = 'pricing';
      }

      res.json({
        insight,
        reportType,
        timestamp: new Date().toISOString(),
        context: {
          division,
          location: 'Seattle, WA'
        }
      });

    } catch (error: any) {
      console.error('Business insight generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate business insight',
        details: error.message 
      });
    }
  });

  // Division routes
  app.get('/api/divisions', isAuthenticated, async (req, res) => {
    try {
      const divisions = await storage.getDivisions();
      res.json(divisions);
    } catch (error) {
      console.error("Error fetching divisions:", error);
      res.status(500).json({ message: "Failed to fetch divisions" });
    }
  });

  app.get('/api/divisions/:id', isAuthenticated, async (req, res) => {
    try {
      const division = await storage.getDivision(req.params.id);
      if (!division) {
        return res.status(404).json({ message: "Division not found" });
      }
      res.json(division);
    } catch (error) {
      console.error("Error fetching division:", error);
      res.status(500).json({ message: "Failed to fetch division" });
    }
  });

  app.post('/api/divisions', isAuthenticated, async (req: any, res) => {
    try {
      const divisionData = insertDivisionSchema.parse(req.body);
      const division = await storage.createDivision(divisionData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'create',
        description: `Created division: ${division.name}`,
        entityType: 'division',
        entityId: division.id,
      });

      res.status(201).json(division);
    } catch (error: any) {
      console.error("Error creating division:", error);
      res.status(400).json({ message: error.message || "Failed to create division" });
    }
  });

  app.put('/api/divisions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const divisionData = insertDivisionSchema.partial().parse(req.body);
      const division = await storage.updateDivision(req.params.id, divisionData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'update',
        description: `Updated division: ${division.name}`,
        entityType: 'division',
        entityId: division.id,
      });

      res.json(division);
    } catch (error: any) {
      console.error("Error updating division:", error);
      res.status(400).json({ message: error.message || "Failed to update division" });
    }
  });

  app.delete('/api/divisions/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteDivision(req.params.id);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'delete',
        description: `Deleted division`,
        entityType: 'division',
        entityId: req.params.id,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting division:", error);
      res.status(500).json({ message: "Failed to delete division" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string;
      const customers = await storage.getCustomers(divisionId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'create',
        description: `Added new customer: ${customer.name}`,
        entityType: 'customer',
        entityId: customer.id,
      });

      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: error.message || "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'update',
        description: `Updated customer: ${customer.name}`,
        entityType: 'customer',
        entityId: customer.id,
      });

      res.json(customer);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: error.message || "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'delete',
        description: `Deleted customer`,
        entityType: 'customer',
        entityId: req.params.id,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Job routes
  app.get('/api/jobs', isAuthenticated, async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string;
      const jobs = await storage.getJobs(divisionId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get('/api/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'create',
        description: `Created new job for customer ID: ${job.customerId}`,
        entityType: 'job',
        entityId: job.id,
      });

      res.status(201).json(job);
    } catch (error: any) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: error.message || "Failed to create job" });
    }
  });

  app.put('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const jobData = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(req.params.id, jobData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'update',
        description: `Updated job for customer ID: ${job.customerId}`,
        entityType: 'job',
        entityId: job.id,
      });

      res.json(job);
    } catch (error: any) {
      console.error("Error updating job:", error);
      res.status(400).json({ message: error.message || "Failed to update job" });
    }
  });

  app.delete('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteJob(req.params.id);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'delete',
        description: `Deleted job`,
        entityType: 'job',
        entityId: req.params.id,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Estimate routes
  app.get('/api/estimates', isAuthenticated, async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string;
      const estimates = await storage.getEstimates(divisionId);
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.get('/api/estimates/:id', isAuthenticated, async (req, res) => {
    try {
      const estimate = await storage.getEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching estimate:", error);
      res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  app.post('/api/estimates', isAuthenticated, async (req: any, res) => {
    try {
      const estimateData = insertEstimateSchema.parse(req.body);
      const estimate = await storage.createEstimate(estimateData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'create',
        description: `Created new estimate for job ID: ${estimate.jobId}`,
        entityType: 'estimate',
        entityId: estimate.id,
      });

      res.status(201).json(estimate);
    } catch (error: any) {
      console.error("Error creating estimate:", error);
      res.status(400).json({ message: error.message || "Failed to create estimate" });
    }
  });

  app.put('/api/estimates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const estimateData = insertEstimateSchema.partial().parse(req.body);
      const estimate = await storage.updateEstimate(req.params.id, estimateData);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'update',
        description: `Updated estimate for job ID: ${estimate.jobId}`,
        entityType: 'estimate',
        entityId: estimate.id,
      });

      res.json(estimate);
    } catch (error: any) {
      console.error("Error updating estimate:", error);
      res.status(400).json({ message: error.message || "Failed to update estimate" });
    }
  });

  app.delete('/api/estimates/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteEstimate(req.params.id);
      
      await storage.logActivity({
        userId: req.user.claims.sub,
        action: 'delete',
        description: `Deleted estimate`,
        entityType: 'estimate',
        entityId: req.params.id,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting estimate:", error);
      res.status(500).json({ message: "Failed to delete estimate" });
    }
  });

  // Plan file management routes
  app.get('/api/jobs/:jobId/plan-files', authenticateToken, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user!.id;
      
      // Check if user has access to this job via division
      const job = await storage.getJobWithDivisionAccess(jobId, userId);
      if (!job) {
        return res.status(404).json({ error: "Job not found or access denied" });
      }
      
      const planFiles = await storage.getPlanFilesByJobId(jobId);
      res.json({ planFiles });
    } catch (error) {
      console.error("Error fetching plan files:", error);
      res.status(500).json({ error: "Failed to fetch plan files" });
    }
  });

  app.post('/api/plans/upload-url', authenticateToken, async (req: any, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const uploadUrl = await objectStorageService.getPDFUploadURL();
      
      res.json({ uploadUrl });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post('/api/plans/files', authenticateToken, async (req: any, res) => {
    try {
      const { jobId, url, filename, pages } = req.body;
      const userId = req.user!.id;
      
      // Check if user has access to this job via division
      const job = await storage.getJobWithDivisionAccess(jobId, userId);
      if (!job) {
        return res.status(404).json({ error: "Job not found or access denied" });
      }
      
      // Validate required fields
      if (!url || !filename || !jobId) {
        return res.status(400).json({ error: "JobId, URL and filename are required" });
      }

      // Normalize the object storage URL
      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const normalizedUrl = objectStorageService.normalizeObjectPath(url);
      
      const planFileData = {
        jobId,
        url: normalizedUrl,
        filename,
        pages: pages || 1,
        uploadedBy: userId
      };
      
      const planFile = await storage.createPlanFile(planFileData);
      res.json({ planFile });
    } catch (error: any) {
      console.error("Error creating plan file:", error);
      res.status(500).json({ error: error.message || "Failed to create plan file" });
    }
  });

  // Plan annotation routes
  app.get('/api/plans/:planId/annotations', authenticateToken, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const userId = req.user!.id;
      
      // Check if user has access to this plan via job division
      const plan = await storage.getPlanFileWithDivisionAccess(planId, userId);
      if (!plan) {
        return res.status(404).json({ error: "Plan file not found or access denied" });
      }
      
      const annotations = await storage.getPlanAnnotations(planId);
      res.json({ annotations });
    } catch (error) {
      console.error("Error fetching plan annotations:", error);
      res.status(500).json({ error: "Failed to fetch plan annotations" });
    }
  });

  app.post('/api/plans/:planId/annotations', authenticateToken, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const { annotations } = req.body;
      const userId = req.user!.id;
      
      // Check if user has access to this plan via job division
      const plan = await storage.getPlanFileWithDivisionAccess(planId, userId);
      if (!plan) {
        return res.status(404).json({ error: "Plan file not found or access denied" });
      }
      
      // Validate annotations array
      if (!Array.isArray(annotations)) {
        return res.status(400).json({ error: "Annotations must be an array" });
      }
      
      const savedAnnotations = await storage.upsertPlanAnnotations(planId, annotations, userId);
      res.json({ annotations: savedAnnotations });
    } catch (error) {
      console.error("Error saving plan annotations:", error);
      res.status(500).json({ error: "Failed to save plan annotations" });
    }
  });

  // Plan scale routes
  app.get('/api/plans/:planId/scales', authenticateToken, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const userId = req.user!.id;
      
      // Check if user has access to this plan via job division
      const plan = await storage.getPlanFileWithDivisionAccess(planId, userId);
      if (!plan) {
        return res.status(404).json({ error: "Plan file not found or access denied" });
      }
      
      const scales = await storage.getPlanScales(planId);
      res.json({ scales });
    } catch (error) {
      console.error("Error fetching plan scales:", error);
      res.status(500).json({ error: "Failed to fetch plan scales" });
    }
  });

  app.post('/api/plans/:planId/scales', authenticateToken, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const { page, pixelPerUnit, unit } = req.body;
      const userId = req.user!.id;
      
      // Check if user has access to this plan via job division
      const plan = await storage.getPlanFileWithDivisionAccess(planId, userId);
      if (!plan) {
        return res.status(404).json({ error: "Plan file not found or access denied" });
      }
      
      // Validate required fields
      if (typeof page !== 'number' || typeof pixelPerUnit !== 'number' || typeof unit !== 'string') {
        return res.status(400).json({ error: "Invalid scale data: page (number), pixelPerUnit (number), and unit (string) are required" });
      }
      
      const savedScale = await storage.upsertPlanScale(planId, page, pixelPerUnit, unit, userId);
      res.json({ scale: savedScale });
    } catch (error) {
      console.error("Error saving plan scale:", error);
      res.status(500).json({ error: "Failed to save plan scale" });
    }
  });

  // Plan export route - flatten annotations into PDF
  app.post('/api/plans/:planId/export', authenticateToken, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const userId = req.user!.id;
      
      // Check if user has access to this plan via job division
      const plan = await storage.getPlanFileWithDivisionAccess(planId, userId);
      if (!plan) {
        return res.status(404).json({ error: "Plan file not found or access denied" });
      }
      
      // Get all annotations for this plan
      const annotations = await storage.getPlanAnnotations(planId);
      
      // Get all scales for this plan
      const scales = await storage.getPlanScales(planId);
      
      // Create a scales lookup by page
      const scalesByPage: Record<number, { pixelPerUnit: number; unit: string }> = {};
      scales.forEach(scale => {
        scalesByPage[scale.page] = {
          pixelPerUnit: Number(scale.pixelPerUnit),
          unit: scale.unit
        };
      });
      
      // Import pdf-lib
      const { PDFDocument, rgb, degrees } = await import('pdf-lib');
      
      // Load the original PDF from URL
      let pdfBytes: Uint8Array;
      try {
        const response = await fetch(plan.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      } catch (error) {
        console.error("Error fetching PDF:", error);
        return res.status(500).json({ error: "Failed to fetch source PDF" });
      }
      
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Group annotations by page
      const annotationsByPage: Record<number, typeof annotations> = {};
      annotations.forEach(annotation => {
        if (!annotationsByPage[annotation.page]) {
          annotationsByPage[annotation.page] = [];
        }
        annotationsByPage[annotation.page].push(annotation);
      });
      
      // Process each page
      for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
        const page = pages[pageNum - 1];
        const pageAnnotations = annotationsByPage[pageNum] || [];
        
        if (pageAnnotations.length === 0) continue;
        
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Helper function to convert normalized coordinates to PDF coordinates
        const normalizedToPdf = (normalizedValue: number, dimension: 'width' | 'height') => {
          if (dimension === 'width') {
            return normalizedValue * pageWidth;
          } else {
            // PDF coordinates have origin at bottom-left, we need to flip Y
            return pageHeight - (normalizedValue * pageHeight);
          }
        };
        
        // Process each annotation on this page
        for (const annotation of pageAnnotations) {
          const shape = annotation.dataJson as any; // Shape data from client
          
          // Convert color from hex to RGB
          const hexColor = shape.style?.stroke || '#ff0000';
          const hexR = parseInt(hexColor.slice(1, 3), 16) / 255;
          const hexG = parseInt(hexColor.slice(3, 5), 16) / 255;
          const hexB = parseInt(hexColor.slice(5, 7), 16) / 255;
          const strokeColor = rgb(hexR, hexG, hexB);
          
          const fillColor = shape.style?.fill ? 
            (() => {
              const fillHex = shape.style.fill;
              const fR = parseInt(fillHex.slice(1, 3), 16) / 255;
              const fG = parseInt(fillHex.slice(3, 5), 16) / 255;
              const fB = parseInt(fillHex.slice(5, 7), 16) / 255;
              return rgb(fR, fG, fB);
            })() : undefined;
          
          const strokeWidth = shape.style?.width || 2;
          const opacity = shape.style?.opacity || 1;
          
          switch (shape.type) {
            case 'rect':
              if (shape.x !== undefined && shape.y !== undefined && shape.w !== undefined && shape.h !== undefined) {
                const x = normalizedToPdf(shape.x, 'width');
                const y = normalizedToPdf(shape.y + shape.h, 'height'); // Bottom-left corner
                const width = normalizedToPdf(shape.w, 'width') - normalizedToPdf(0, 'width');
                const height = normalizedToPdf(shape.h, 'height') - normalizedToPdf(0, 'height');
                
                page.drawRectangle({
                  x,
                  y,
                  width,
                  height,
                  borderColor: strokeColor,
                  borderWidth: strokeWidth,
                  color: fillColor,
                  opacity: fillColor ? opacity : undefined,
                  borderOpacity: opacity
                });
              }
              break;
              
            case 'ellipse':
              if (shape.x !== undefined && shape.y !== undefined && shape.w !== undefined && shape.h !== undefined) {
                const centerX = normalizedToPdf(shape.x + shape.w / 2, 'width');
                const centerY = normalizedToPdf(shape.y + shape.h / 2, 'height');
                const radiusX = (normalizedToPdf(shape.w, 'width') - normalizedToPdf(0, 'width')) / 2;
                const radiusY = (normalizedToPdf(shape.h, 'height') - normalizedToPdf(0, 'height')) / 2;
                
                page.drawEllipse({
                  x: centerX,
                  y: centerY,
                  xScale: radiusX,
                  yScale: radiusY,
                  borderColor: strokeColor,
                  borderWidth: strokeWidth,
                  color: fillColor,
                  opacity: fillColor ? opacity : undefined,
                  borderOpacity: opacity
                });
              }
              break;
              
            case 'polyline':
            case 'polygon':
            case 'arrow':
              if (shape.points && shape.points.length >= 4) {
                const points: [number, number][] = [];
                for (let i = 0; i < shape.points.length; i += 2) {
                  const x = normalizedToPdf(shape.points[i], 'width');
                  const y = normalizedToPdf(shape.points[i + 1], 'height');
                  points.push([x, y]);
                }
                
                if (points.length >= 2) {
                  // Draw line segments
                  for (let i = 0; i < points.length - 1; i++) {
                    page.drawLine({
                      start: { x: points[i][0], y: points[i][1] },
                      end: { x: points[i + 1][0], y: points[i + 1][1] },
                      color: strokeColor,
                      thickness: strokeWidth,
                      opacity
                    });
                  }
                  
                  // Close polygon
                  if (shape.type === 'polygon' && points.length >= 3) {
                    page.drawLine({
                      start: { x: points[points.length - 1][0], y: points[points.length - 1][1] },
                      end: { x: points[0][0], y: points[0][1] },
                      color: strokeColor,
                      thickness: strokeWidth,
                      opacity
                    });
                  }
                  
                  // Draw arrowhead for arrow type
                  if (shape.type === 'arrow' && points.length >= 2) {
                    const lastPoint = points[points.length - 1];
                    const secondLastPoint = points[points.length - 2];
                    
                    // Calculate arrow direction
                    const dx = lastPoint[0] - secondLastPoint[0];
                    const dy = lastPoint[1] - secondLastPoint[1];
                    const length = Math.sqrt(dx * dx + dy * dy);
                    
                    if (length > 0) {
                      const arrowLength = 10;
                      const arrowAngle = Math.PI / 6; // 30 degrees
                      
                      const unitX = dx / length;
                      const unitY = dy / length;
                      
                      // Arrow tip points
                      const tip1X = lastPoint[0] - arrowLength * (unitX * Math.cos(arrowAngle) + unitY * Math.sin(arrowAngle));
                      const tip1Y = lastPoint[1] - arrowLength * (unitY * Math.cos(arrowAngle) - unitX * Math.sin(arrowAngle));
                      const tip2X = lastPoint[0] - arrowLength * (unitX * Math.cos(-arrowAngle) + unitY * Math.sin(-arrowAngle));
                      const tip2Y = lastPoint[1] - arrowLength * (unitY * Math.cos(-arrowAngle) - unitX * Math.sin(-arrowAngle));
                      
                      // Draw arrow lines
                      page.drawLine({
                        start: { x: lastPoint[0], y: lastPoint[1] },
                        end: { x: tip1X, y: tip1Y },
                        color: strokeColor,
                        thickness: strokeWidth,
                        opacity
                      });
                      page.drawLine({
                        start: { x: lastPoint[0], y: lastPoint[1] },
                        end: { x: tip2X, y: tip2Y },
                        color: strokeColor,
                        thickness: strokeWidth,
                        opacity
                      });
                    }
                  }
                }
              }
              break;
              
            case 'text':
              if (shape.x !== undefined && shape.y !== undefined && shape.meta?.text) {
                const x = normalizedToPdf(shape.x, 'width');
                const y = normalizedToPdf(shape.y, 'height');
                const fontSize = shape.meta?.fontSize || 16;
                
                page.drawText(shape.meta.text, {
                  x,
                  y,
                  size: fontSize,
                  color: strokeColor,
                  opacity
                });
              }
              break;
              
            case 'highlighter':
              // Draw highlighter as semi-transparent polygon
              if (shape.points && shape.points.length >= 6) {
                const points: [number, number][] = [];
                for (let i = 0; i < shape.points.length; i += 2) {
                  const x = normalizedToPdf(shape.points[i], 'width');
                  const y = normalizedToPdf(shape.points[i + 1], 'height');
                  points.push([x, y]);
                }
                
                if (points.length >= 3) {
                  // Draw filled polygon with transparency
                  for (let i = 0; i < points.length - 1; i++) {
                    page.drawLine({
                      start: { x: points[i][0], y: points[i][1] },
                      end: { x: points[i + 1][0], y: points[i + 1][1] },
                      color: strokeColor,
                      thickness: strokeWidth * 4, // Thicker for highlighter effect
                      opacity: 0.3 // Semi-transparent
                    });
                  }
                  // Close the shape
                  page.drawLine({
                    start: { x: points[points.length - 1][0], y: points[points.length - 1][1] },
                    end: { x: points[0][0], y: points[0][1] },
                    color: strokeColor,
                    thickness: strokeWidth * 4,
                    opacity: 0.3
                  });
                }
              }
              break;
              
            case 'measure_line':
            case 'measure_area':
              // Draw measurement shapes similar to polyline/polygon
              if (shape.points && shape.points.length >= 4) {
                const points: [number, number][] = [];
                for (let i = 0; i < shape.points.length; i += 2) {
                  const x = normalizedToPdf(shape.points[i], 'width');
                  const y = normalizedToPdf(shape.points[i + 1], 'height');
                  points.push([x, y]);
                }
                
                if (points.length >= 2) {
                  // Draw measurement lines
                  for (let i = 0; i < points.length - 1; i++) {
                    page.drawLine({
                      start: { x: points[i][0], y: points[i][1] },
                      end: { x: points[i + 1][0], y: points[i + 1][1] },
                      color: strokeColor,
                      thickness: strokeWidth,
                      opacity,
                      dashArray: [5, 3] // Dashed line for measurements
                    });
                  }
                  
                  // Close area measurement
                  if (shape.type === 'measure_area' && points.length >= 3) {
                    page.drawLine({
                      start: { x: points[points.length - 1][0], y: points[points.length - 1][1] },
                      end: { x: points[0][0], y: points[0][1] },
                      color: strokeColor,
                      thickness: strokeWidth,
                      opacity,
                      dashArray: [5, 3]
                    });
                  }
                  
                  // Add measurement text if available
                  if (shape.meta?.length || shape.meta?.area) {
                    const centerX = points.reduce((sum, p) => sum + p[0], 0) / points.length;
                    const centerY = points.reduce((sum, p) => sum + p[1], 0) / points.length;
                    
                    const measurementText = shape.type === 'measure_line' 
                      ? `${shape.meta.length?.toFixed(2)} ${shape.meta.units || 'px'}`
                      : `${shape.meta.area?.toFixed(2)} ${shape.meta.units || 'px²'}`;
                    
                    page.drawText(measurementText, {
                      x: centerX - 20, // Offset to avoid overlap
                      y: centerY + 10,
                      size: 10,
                      color: strokeColor,
                      opacity
                    });
                  }
                }
              }
              break;
          }
        }
      }
      
      // Generate the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      const baseFilename = plan.filename.replace('.pdf', '');
      const exportFilename = `${baseFilename}_annotated_${timestamp}.pdf`;
      
      // Set response headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
      res.setHeader('Content-Length', modifiedPdfBytes.length.toString());
      
      // Send the PDF
      res.send(Buffer.from(modifiedPdfBytes));
      
    } catch (error: any) {
      console.error("Error exporting plan:", error);
      res.status(500).json({ error: error.message || "Failed to export plan" });
    }
  });

  // Serve PDF files from object storage
  app.get('/api/plans/:planFileId/pdf', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { planFileId } = req.params;
      const userId = req.user!.id;
      
      // Get the plan file
      const planFile = await storage.getPlanFile(planFileId);
      if (!planFile) {
        return res.status(404).json({ error: "Plan file not found" });
      }
      
      // Check if user has access to this job via division
      const job = await storage.getJobWithDivisionAccess(planFile.jobId, userId);
      if (!job) {
        return res.status(404).json({ error: "Access denied" });
      }
      
      try {
        const { ObjectStorageService } = await import('./objectStorage.js');
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectFile(planFile.url);
        await objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error serving PDF from object storage:", error);
        // If object storage fails, try direct URL fetch as fallback
        if (planFile.url.startsWith('http')) {
          const response = await fetch(planFile.url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            res.setHeader('Content-Type', 'application/pdf');
            res.send(Buffer.from(buffer));
          } else {
            res.status(404).json({ error: "PDF file not accessible" });
          }
        } else {
          res.status(404).json({ error: "PDF file not found" });
        }
      }
    } catch (error) {
      console.error("Error serving PDF:", error);
      res.status(500).json({ error: "Failed to serve PDF file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
