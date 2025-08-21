import { z } from 'zod';
import { Router } from 'express';
import { createContext, requireRole, getDivisionScope, TRPCError } from '../trpc';
import { storage } from '../storage';
import superjson from 'superjson';

export const createAnalyticsRoutes = (router: Router) => {

  // Analytics API endpoints
  router.get('/analytics.overview', async (req, res) => {
  try {
    const ctx = await createContext(req, res);
    const user = requireRole('staff')(ctx);
    
    const inputSchema = z.object({
      divisionKey: z.enum(['mfnc', 'sfnc', 'rr', 'all']).optional().default('all'),
      dateRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    });
    
    const input = inputSchema.parse(req.query);
    const scopedDivisionId = await getDivisionScope(user, input.divisionKey);
    
    // Calculate date range
    const now = new Date();
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[input.dateRange];
    
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    // Get all data filtered by division and date range
    let jobs = await storage.getJobs(scopedDivisionId);
    let estimates = await storage.getEstimates();
    let leads = await storage.getLeads(scopedDivisionId);
    let customers = await storage.getCustomers(scopedDivisionId);
    
    // Filter by date range
    jobs = jobs.filter(job => new Date(job.createdAt) >= startDate);
    estimates = estimates.filter(est => new Date(est.createdAt) >= startDate);
    leads = leads.filter(lead => new Date(lead.createdAt) >= startDate);
    customers = customers.filter(cust => new Date(cust.createdAt) >= startDate);
    
    // Filter estimates by division if needed
    if (scopedDivisionId) {
      estimates = estimates.filter(est => est.job?.divisionId === scopedDivisionId);
    }
    
    // Calculate key metrics
    const totalRevenue = estimates
      .filter(est => est.status === 'approved')
      .reduce((sum, est) => sum + (est.totalCents || 0), 0);
    
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    
    const avgJobValue = estimates.length > 0 
      ? estimates.reduce((sum, est) => sum + (est.totalCents || 0), 0) / estimates.length
      : 0;
    
    // Lead conversion rate
    const wonLeads = leads.filter(lead => lead.status === 'won').length;
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    
    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    let prevJobs = await storage.getJobs(scopedDivisionId);
    let prevEstimates = await storage.getEstimates();
    let prevLeads = await storage.getLeads(scopedDivisionId);
    
    prevJobs = prevJobs.filter(job => {
      const jobDate = new Date(job.createdAt);
      return jobDate >= prevStartDate && jobDate < startDate;
    });
    
    prevEstimates = prevEstimates.filter(est => {
      const estDate = new Date(est.createdAt);
      return estDate >= prevStartDate && estDate < startDate;
    });
    
    if (scopedDivisionId) {
      prevEstimates = prevEstimates.filter(est => est.job?.divisionId === scopedDivisionId);
    }
    
    prevLeads = prevLeads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= prevStartDate && leadDate < startDate;
    });
    
    const prevTotalRevenue = prevEstimates
      .filter(est => est.status === 'approved')
      .reduce((sum, est) => sum + (est.totalCents || 0), 0);
    
    const prevCompletedJobs = prevJobs.filter(job => job.status === 'completed').length;
    
    const prevAvgJobValue = prevEstimates.length > 0 
      ? prevEstimates.reduce((sum, est) => sum + (est.totalCents || 0), 0) / prevEstimates.length
      : 0;
    
    const prevWonLeads = prevLeads.filter(lead => lead.status === 'won').length;
    const prevTotalLeads = prevLeads.length;
    const prevConversionRate = prevTotalLeads > 0 ? (prevWonLeads / prevTotalLeads) * 100 : 0;
    
    // Calculate percentage changes
    const revenueChange = prevTotalRevenue > 0 
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
      : 0;
    
    const jobsChange = prevCompletedJobs > 0 
      ? ((completedJobs - prevCompletedJobs) / prevCompletedJobs) * 100 
      : 0;
    
    const avgJobValueChange = prevAvgJobValue > 0 
      ? ((avgJobValue - prevAvgJobValue) / prevAvgJobValue) * 100 
      : 0;
    
    const conversionRateChange = prevConversionRate > 0 
      ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 
      : 0;
    
    // Top customers by revenue
    const customerRevenue = new Map();
    estimates.filter(est => est.status === 'approved').forEach(est => {
      const customerId = est.job?.customerId;
      if (customerId) {
        const current = customerRevenue.get(customerId) || { revenue: 0, jobs: 0 };
        current.revenue += est.totalCents || 0;
        current.jobs += 1;
        customerRevenue.set(customerId, current);
      }
    });
    
    const topCustomers = Array.from(customerRevenue.entries())
      .map(([customerId, data]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          id: customerId,
          name: customer?.name || 'Unknown Customer',
          revenue: data.revenue,
          jobs: data.jobs
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Revenue trend by month (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthEstimates = estimates.filter(est => {
        const estDate = new Date(est.createdAt);
        return estDate >= monthStart && estDate <= monthEnd && est.status === 'approved';
      });
      
      const monthRevenue = monthEstimates.reduce((sum, est) => sum + (est.totalCents || 0), 0);
      const monthJobCount = monthEstimates.length;
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        jobs: monthJobCount
      });
    }
    
    // Calculate operational efficiency metrics
    const onTimeJobs = jobs.filter(job => job.status === 'completed').length; // Simplified - could track actual completion dates
    const onTimeCompletion = jobs.length > 0 ? (onTimeJobs / jobs.length) * 100 : 0;
    
    // Calculate repeat customers
    const customerJobCounts = new Map();
    jobs.forEach(job => {
      const count = customerJobCounts.get(job.customerId) || 0;
      customerJobCounts.set(job.customerId, count + 1);
    });
    
    const repeatCustomers = Array.from(customerJobCounts.values()).filter(count => count > 1).length;
    const totalUniqueCustomers = customerJobCounts.size;
    const repeatCustomerPercentage = totalUniqueCustomers > 0 ? (repeatCustomers / totalUniqueCustomers) * 100 : 0;
    
    const result = {
      overview: {
        totalRevenue,
        revenueChange,
        completedJobs,
        jobsChange,
        avgJobValue,
        avgJobValueChange,
        conversionRate,
        conversionRateChange,
        totalLeads,
        wonLeads,
        onTimeCompletion,
        repeatCustomerPercentage
      },
      monthlyRevenue,
      topCustomers,
      leadMetrics: {
        byStatus: {
          new: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          qualified: leads.filter(l => l.status === 'qualified').length,
          proposal: leads.filter(l => l.status === 'proposal').length,
          negotiation: leads.filter(l => l.status === 'negotiation').length,
          won: leads.filter(l => l.status === 'won').length,
          lost: leads.filter(l => l.status === 'lost').length,
        },
        totalValue: leads.reduce((sum, lead) => sum + (lead.value || 0), 0),
        wonValue: leads.filter(l => l.status === 'won').reduce((sum, lead) => sum + (lead.value || 0), 0)
      }
    };
    
    res.json({ result: superjson.serialize(result) });
  } catch (error) {
      console.error('Error in analytics.overview:', error);
      if (error instanceof TRPCError) {
        res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
      } else {
        res.status(500).json({ error: { message: 'Internal server error' } });
      }
    }
  });
};