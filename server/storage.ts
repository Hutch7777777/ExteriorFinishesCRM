import {
  users,
  customers,
  jobs,
  estimates,
  divisions,
  type User,
  type InsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Division operations
  getDivisions(): Promise<Division[]>;
  getDivision(id: string): Promise<Division | undefined>;
  getDivisionByKey(key: 'mfnc' | 'sfnc' | 'rr'): Promise<Division | undefined>;
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
  getEstimates(jobId?: string): Promise<EstimateWithRelations[]>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: userData,
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

  async getDivisionByKey(key: 'mfnc' | 'sfnc' | 'rr'): Promise<Division | undefined> {
    const [division] = await db.select().from(divisions).where(eq(divisions.key, key));
    return division;
  }

  async createDivision(division: InsertDivision): Promise<Division> {
    const [newDivision] = await db.insert(divisions).values(division).returning();
    return newDivision;
  }

  async updateDivision(id: string, division: Partial<InsertDivision>): Promise<Division> {
    const [updatedDivision] = await db
      .update(divisions)
      .set(division)
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
      .set(customer)
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
      .leftJoin(users, eq(jobs.createdBy, users.id))
      .orderBy(desc(jobs.createdAt));

    if (divisionId) {
      query.where(eq(jobs.divisionId, divisionId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.jobs,
      customer: row.customers || undefined,
      division: row.divisions || undefined,
      createdByUser: row.users || undefined,
    }));
  }

  async getJob(id: string): Promise<JobWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(divisions, eq(jobs.divisionId, divisions.id))
      .leftJoin(users, eq(jobs.createdBy, users.id))
      .where(eq(jobs.id, id));

    if (!result) return undefined;

    return {
      ...result.jobs,
      customer: result.customers || undefined,
      division: result.divisions || undefined,
      createdByUser: result.users || undefined,
    };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set(job)
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
      .leftJoin(users, eq(jobs.createdBy, users.id))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);

    return results.map(row => ({
      ...row.jobs,
      customer: row.customers || undefined,
      division: row.divisions || undefined,
      createdByUser: row.users || undefined,
    }));
  }

  // Estimate operations
  async getEstimates(jobId?: string): Promise<EstimateWithRelations[]> {
    const query = db
      .select()
      .from(estimates)
      .leftJoin(jobs, eq(estimates.jobId, jobs.id))
      .orderBy(desc(estimates.createdAt));

    if (jobId) {
      query.where(eq(estimates.jobId, jobId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.estimates,
      job: row.jobs || undefined,
    }));
  }

  async getEstimate(id: string): Promise<EstimateWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(estimates)
      .leftJoin(jobs, eq(estimates.jobId, jobs.id))
      .where(eq(estimates.id, id));

    if (!result) return undefined;

    return {
      ...result.estimates,
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
      .set(estimate)
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
    const [activeJobsResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, 'active'));

    const [totalCustomersResult] = await db
      .select({ count: count() })
      .from(customers);

    const [pendingEstimatesResult] = await db
      .select({ count: count() })
      .from(estimates)
      .where(eq(estimates.status, 'sent'));

    // Calculate total revenue from approved estimates
    const [revenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${estimates.totalCents}), 0)::int`
      })
      .from(estimates)
      .where(eq(estimates.status, 'approved'));

    return {
      totalRevenue: (revenueResult?.total || 0) / 100, // Convert cents to dollars
      activeJobs: activeJobsResult?.count || 0,
      totalCustomers: totalCustomersResult?.count || 0,
      pendingEstimates: pendingEstimatesResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();