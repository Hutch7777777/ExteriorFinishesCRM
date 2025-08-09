import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import authRoutes from "./authRoutes";
import { authenticateToken } from "./auth";
import type { AuthenticatedRequest } from "./auth";
import { 
  insertDivisionSchema,
  insertCustomerSchema,
  insertJobSchema,
  insertEstimateSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT Auth routes
  app.use('/api/auth', authRoutes);

  // Replit Auth middleware (keep for future compatibility)
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
        description: `Created new job: ${job.title}`,
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
        description: `Updated job: ${job.title}`,
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
        description: `Created new estimate: ${estimate.title}`,
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
        description: `Updated estimate: ${estimate.title}`,
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

  const httpServer = createServer(app);
  return httpServer;
}
