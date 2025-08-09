import {
  users,
  customers,
  jobs,
  estimates,
  divisions,
  activityLog,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type CustomerWithRelations,
  type Job,
  type InsertJob,
  type JobWithRelations,
  type Estimate,
  type InsertEstimate,
  type EstimateWithRelations,
  type Division,
  type InsertDivision,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Division operations
  getDivisions(): Promise<Division[]>;
  getDivision(id: string): Promise<Division | undefined>;
  createDivision(division: InsertDivision): Promise<Division>;
  updateDivision(id: string, division: Partial<InsertDivision>): Promise<Division>;
  deleteDivision(id: string): Promise<void>;

  // Customer operations
  getCustomers(divisionId?: string): Promise<CustomerWithRelations[]>;
  getCustomer(id: string): Promise<CustomerWithRelations | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Job operations
  getJobs(divisionId?: string): Promise<JobWithRelations[]>;
  getJob(id: string): Promise<JobWithRelations | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  getRecentJobs(limit?: number): Promise<JobWithRelations[]>;

  // Estimate operations
  getEstimates(divisionId?: string): Promise<EstimateWithRelations[]>;
  getEstimate(id: string): Promise<EstimateWithRelations | undefined>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate>;
  deleteEstimate(id: string): Promise<void>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalRevenue: number;
    activeJobs: number;
    totalCustomers: number;
    pendingEstimates: number;
  }>;

  // Activity log
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Division operations
  async getDivisions(): Promise<Division[]> {
    return await db.select().from(divisions).orderBy(divisions.name);
  }

  async getDivision(id: string): Promise<Division | undefined> {
    const [division] = await db.select().from(divisions).where(eq(divisions.id, id));
    return division;
  }

  async createDivision(division: InsertDivision): Promise<Division> {
    const [newDivision] = await db.insert(divisions).values(division).returning();
    return newDivision;
  }

  async updateDivision(id: string, division: Partial<InsertDivision>): Promise<Division> {
    const [updatedDivision] = await db
      .update(divisions)
      .set({ ...division, updatedAt: new Date() })
      .where(eq(divisions.id, id))
      .returning();
    return updatedDivision;
  }

  async deleteDivision(id: string): Promise<void> {
    await db.delete(divisions).where(eq(divisions.id, id));
  }

  // Customer operations
  async getCustomers(divisionId?: string): Promise<CustomerWithRelations[]> {
    const query = db
      .select()
      .from(customers)
      .leftJoin(divisions, eq(customers.divisionId, divisions.id))
      .orderBy(desc(customers.createdAt));

    if (divisionId) {
      query.where(eq(customers.divisionId, divisionId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.customers,
      division: row.divisions || undefined,
    }));
  }

  async getCustomer(id: string): Promise<CustomerWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(customers)
      .leftJoin(divisions, eq(customers.divisionId, divisions.id))
      .where(eq(customers.id, id));

    if (!result) return undefined;

    return {
      ...result.customers,
      division: result.divisions || undefined,
    };
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Job operations
  async getJobs(divisionId?: string): Promise<JobWithRelations[]> {
    const query = db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(divisions, eq(jobs.divisionId, divisions.id))
      .orderBy(desc(jobs.createdAt));

    if (divisionId) {
      query.where(eq(jobs.divisionId, divisionId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.jobs,
      customer: row.customers || undefined,
      division: row.divisions || undefined,
    }));
  }

  async getJob(id: string): Promise<JobWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(divisions, eq(jobs.divisionId, divisions.id))
      .where(eq(jobs.id, id));

    if (!result) return undefined;

    return {
      ...result.jobs,
      customer: result.customers || undefined,
      division: result.divisions || undefined,
    };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async deleteJob(id: string): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  async getRecentJobs(limit = 10): Promise<JobWithRelations[]> {
    const results = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(divisions, eq(jobs.divisionId, divisions.id))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);

    return results.map(row => ({
      ...row.jobs,
      customer: row.customers || undefined,
      division: row.divisions || undefined,
    }));
  }

  // Estimate operations
  async getEstimates(divisionId?: string): Promise<EstimateWithRelations[]> {
    const query = db
      .select()
      .from(estimates)
      .leftJoin(customers, eq(estimates.customerId, customers.id))
      .leftJoin(divisions, eq(estimates.divisionId, divisions.id))
      .leftJoin(jobs, eq(estimates.jobId, jobs.id))
      .orderBy(desc(estimates.createdAt));

    if (divisionId) {
      query.where(eq(estimates.divisionId, divisionId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.estimates,
      customer: row.customers || undefined,
      division: row.divisions || undefined,
      job: row.jobs || undefined,
    }));
  }

  async getEstimate(id: string): Promise<EstimateWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(estimates)
      .leftJoin(customers, eq(estimates.customerId, customers.id))
      .leftJoin(divisions, eq(estimates.divisionId, divisions.id))
      .leftJoin(jobs, eq(estimates.jobId, jobs.id))
      .where(eq(estimates.id, id));

    if (!result) return undefined;

    return {
      ...result.estimates,
      customer: result.customers || undefined,
      division: result.divisions || undefined,
      job: result.jobs || undefined,
    };
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const [newEstimate] = await db.insert(estimates).values(estimate).returning();
    return newEstimate;
  }

  async updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate> {
    const [updatedEstimate] = await db
      .update(estimates)
      .set({ ...estimate, updatedAt: new Date() })
      .where(eq(estimates.id, id))
      .returning();
    return updatedEstimate;
  }

  async deleteEstimate(id: string): Promise<void> {
    await db.delete(estimates).where(eq(estimates.id, id));
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalRevenue: number;
    activeJobs: number;
    totalCustomers: number;
    pendingEstimates: number;
  }> {
    // Get total revenue from completed jobs
    const [revenueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${jobs.value}), 0)` })
      .from(jobs)
      .where(eq(jobs.status, 'completed'));

    // Get active jobs count
    const [activeJobsResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, 'in_progress'));

    // Get total customers count
    const [customersResult] = await db
      .select({ count: count() })
      .from(customers);

    // Get pending estimates count
    const [estimatesResult] = await db
      .select({ count: count() })
      .from(estimates)
      .where(eq(estimates.status, 'sent'));

    return {
      totalRevenue: Number(revenueResult?.total) || 0,
      activeJobs: activeJobsResult?.count || 0,
      totalCustomers: customersResult?.count || 0,
      pendingEstimates: estimatesResult?.count || 0,
    };
  }

  // Activity log
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [newActivity] = await db.insert(activityLog).values(activity).returning();
    return newActivity;
  }

  async getRecentActivity(limit = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
