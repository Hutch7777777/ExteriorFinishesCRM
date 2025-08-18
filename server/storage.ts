import {
  users,
  customers,
  jobs,
  estimates,
  proposals,
  divisions,
  leads,
  contacts,
  fieldLogs,
  punchListItems,
  planFiles,
  planAnnotations,
  planScales,
  documents,
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
  type Proposal,
  type InsertProposal,
  type ProposalWithRelations,
  type Division,
  type InsertDivision,
  type Lead,
  type InsertLead,
  type LeadWithRelations,
  type Contact,
  type InsertContact,
  type ContactWithRelations,
  type FieldLog,
  type InsertFieldLog,
  type PunchListItem,
  type InsertPunchListItem,
  type PlanFile,
  type PlanAnnotation,
  type PlanScale,
  type Document,
  type InsertDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserCount(): Promise<number>;
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

  // Lead operations
  getLeads(divisionId?: string): Promise<LeadWithRelations[]>;
  getLead(id: string): Promise<LeadWithRelations | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  // Contact operations
  getContacts(divisionId?: string): Promise<ContactWithRelations[]>;
  getContact(id: string): Promise<ContactWithRelations | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;

  // Job operations
  getJobs(divisionId?: string): Promise<JobWithRelations[]>;
  getJob(id: string): Promise<JobWithRelations | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string): Promise<void>;

  // Estimate operations
  getEstimates(leadId?: string, jobId?: string): Promise<Estimate[]>;
  getEstimate(id: string): Promise<Estimate | undefined>;
  getEstimatesByLeadId(leadId: string): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate>;
  deleteEstimate(id: string): Promise<void>;
  getRecentJobs(limit?: number): Promise<JobWithRelations[]>;

  // Estimate operations
  getEstimates(jobId?: string): Promise<EstimateWithRelations[]>;
  getEstimate(id: string): Promise<EstimateWithRelations | undefined>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate>;
  deleteEstimate(id: string): Promise<void>;

  // Proposal operations
  getProposals(divisionId?: string): Promise<ProposalWithRelations[]>;
  getProposal(id: string): Promise<ProposalWithRelations | undefined>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal>;
  deleteProposal(id: string): Promise<void>;

  // Field Management operations
  getFieldLogs(jobId: string): Promise<FieldLog[]>;
  createFieldLog(fieldLog: InsertFieldLog): Promise<FieldLog>;
  updateFieldLog(id: string, fieldLog: Partial<InsertFieldLog>): Promise<FieldLog>;
  deleteFieldLog(id: string): Promise<void>;

  getPunchListItems(jobId: string): Promise<PunchListItem[]>;
  getPunchListItem(id: string): Promise<PunchListItem | undefined>;
  createPunchListItem(item: InsertPunchListItem): Promise<PunchListItem>;
  updatePunchListItem(id: string, item: Partial<InsertPunchListItem>): Promise<PunchListItem>;
  deletePunchListItem(id: string): Promise<void>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalRevenue: number;
    activeJobs: number;
    totalCustomers: number;
    pendingEstimates: number;
  }>;

  // Activity tracking (stub methods for now)
  getRecentActivity(limit?: number): Promise<any[]>;
  logActivity(activity: {
    userId: string;
    action: string;
    description: string;
    entityType: string;
    entityId: string;
  }): Promise<void>;

  // Plan operations
  getPlanFilesByJobId(jobId: string): Promise<PlanFile[]>;
  createPlanFile(planFileData: any): Promise<PlanFile>;
  getPlanFile(planFileId: string): Promise<PlanFile | undefined>;
  getJobWithDivisionAccess(jobId: string, userId: string): Promise<Job | undefined>;
  getPlanFileWithDivisionAccess(planFileId: string, userId: string): Promise<PlanFile | undefined>;
  getPlanAnnotations(planFileId: string): Promise<PlanAnnotation[]>;
  upsertPlanAnnotations(planFileId: string, annotations: any[], userId: string): Promise<PlanAnnotation[]>;
  getPlanScales(planFileId: string): Promise<PlanScale[]>;
  upsertPlanScale(planFileId: string, page: number, pixelPerUnit: number, unit: string, userId: string): Promise<PlanScale>;

  // Documents
  listDocuments(leadId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(data: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
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

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
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

    // Only filter by division if divisionId is provided
    // If divisionId is undefined, show all customers across all divisions
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

  // Lead operations
  async getLeads(divisionId?: string): Promise<LeadWithRelations[]> {
    const query = db
      .select()
      .from(leads)
      .leftJoin(divisions, eq(leads.divisionId, divisions.id))
      .leftJoin(users, eq(leads.createdBy, users.id))
      .orderBy(desc(leads.createdAt));

    // Only filter by division if divisionId is provided
    // If divisionId is undefined, show all leads across all divisions
    if (divisionId) {
      query.where(eq(leads.divisionId, divisionId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.leads,
      division: row.divisions || undefined,
      createdByUser: row.users || undefined,
    }));
  }

  async getLead(id: string): Promise<LeadWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(leads)
      .leftJoin(divisions, eq(leads.divisionId, divisions.id))
      .leftJoin(users, eq(leads.createdBy, users.id))
      .where(eq(leads.id, id));

    if (!result) return undefined;

    return {
      ...result.leads,
      division: result.divisions || undefined,
      createdByUser: result.users || undefined,
    };
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead> {
    const [updatedLead] = await db
      .update(leads)
      .set({
        ...lead,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Contact operations
  async getContacts(divisionId?: string): Promise<ContactWithRelations[]> {
    const query = db
      .select()
      .from(contacts)
      .leftJoin(divisions, eq(contacts.divisionId, divisions.id))
      .leftJoin(users, eq(contacts.createdBy, users.id))
      .orderBy(desc(contacts.createdAt));

    if (divisionId) {
      query.where(eq(contacts.divisionId, divisionId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.contacts,
      division: row.divisions || undefined,
      createdByUser: row.users || undefined,
    }));
  }

  async getContact(id: string): Promise<ContactWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(contacts)
      .leftJoin(divisions, eq(contacts.divisionId, divisions.id))
      .leftJoin(users, eq(contacts.createdBy, users.id))
      .where(eq(contacts.id, id));

    if (!result) return undefined;

    return {
      ...result.contacts,
      division: result.divisions || undefined,
      createdByUser: result.users || undefined,
    };
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values({
      ...contact,
      updatedAt: new Date()
    }).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...contact,
        updatedAt: new Date()
      })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
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

    // Only filter by division if divisionId is provided
    // If divisionId is undefined, show all jobs across all divisions
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
  async getEstimates(leadId?: string, jobId?: string): Promise<Estimate[]> {
    const conditions = [];
    
    if (leadId) {
      conditions.push(eq(estimates.leadId, leadId));
    }
    
    if (jobId) {
      conditions.push(eq(estimates.jobId, jobId));
    }

    return await db.select().from(estimates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(estimates.createdAt));
  }

  async getEstimate(id: string): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates)
      .where(eq(estimates.id, id));
    
    return estimate;
  }

  async getEstimatesByLeadId(leadId: string): Promise<Estimate[]> {
    return await db.select().from(estimates)
      .where(eq(estimates.leadId, leadId))
      .orderBy(desc(estimates.createdAt));
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const [newEstimate] = await db.insert(estimates).values({
      ...estimate,
      updatedAt: new Date()
    }).returning();
    return newEstimate;
  }

  async updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate> {
    const [updatedEstimate] = await db
      .update(estimates)
      .set({
        ...estimate,
        updatedAt: new Date()
      })
      .where(eq(estimates.id, id))
      .returning();
    return updatedEstimate;
  }

  async deleteEstimate(id: string): Promise<void> {
    await db.delete(estimates).where(eq(estimates.id, id));
  }

  // Proposal operations
  async getProposals(divisionId?: string): Promise<ProposalWithRelations[]> {
    const query = db
      .select()
      .from(proposals)
      .leftJoin(customers, eq(proposals.customerId, customers.id))
      .leftJoin(divisions, eq(proposals.divisionId, divisions.id))
      .leftJoin(users, eq(proposals.createdBy, users.id))
      .orderBy(desc(proposals.createdAt));

    if (divisionId) {
      query.where(eq(proposals.divisionId, divisionId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.proposals,
      customer: row.customers || undefined,
      division: row.divisions || undefined,
      createdByUser: row.users || undefined,
    }));
  }

  async getProposal(id: string): Promise<ProposalWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(proposals)
      .leftJoin(customers, eq(proposals.customerId, customers.id))
      .leftJoin(divisions, eq(proposals.divisionId, divisions.id))
      .leftJoin(users, eq(proposals.createdBy, users.id))
      .where(eq(proposals.id, id));

    if (!result) return undefined;

    return {
      ...result.proposals,
      customer: result.customers || undefined,
      division: result.divisions || undefined,
      createdByUser: result.users || undefined,
    };
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db.insert(proposals).values({
      ...proposal,
      updatedAt: new Date()
    }).returning();
    return newProposal;
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({
        ...proposal,
        updatedAt: new Date()
      })
      .where(eq(proposals.id, id))
      .returning();
    return updatedProposal;
  }

  async deleteProposal(id: string): Promise<void> {
    await db.delete(proposals).where(eq(proposals.id, id));
  }

  // Field Management operations
  async getFieldLogs(jobId: string): Promise<FieldLog[]> {
    const results = await db
      .select()
      .from(fieldLogs)
      .where(eq(fieldLogs.jobId, jobId))
      .orderBy(desc(fieldLogs.createdAt));
    return results;
  }

  async createFieldLog(fieldLog: InsertFieldLog): Promise<FieldLog> {
    const [newFieldLog] = await db.insert(fieldLogs).values(fieldLog).returning();
    return newFieldLog;
  }

  async updateFieldLog(id: string, fieldLog: Partial<InsertFieldLog>): Promise<FieldLog> {
    const [updatedFieldLog] = await db
      .update(fieldLogs)
      .set(fieldLog)
      .where(eq(fieldLogs.id, id))
      .returning();
    return updatedFieldLog;
  }

  async deleteFieldLog(id: string): Promise<void> {
    await db.delete(fieldLogs).where(eq(fieldLogs.id, id));
  }

  async getPunchListItems(jobId: string): Promise<PunchListItem[]> {
    const results = await db
      .select()
      .from(punchListItems)
      .where(eq(punchListItems.jobId, jobId))
      .orderBy(punchListItems.priority, desc(punchListItems.createdAt));
    return results;
  }

  async getPunchListItem(id: string): Promise<PunchListItem | undefined> {
    const [result] = await db
      .select()
      .from(punchListItems)
      .where(eq(punchListItems.id, id));
    return result;
  }

  async createPunchListItem(item: InsertPunchListItem): Promise<PunchListItem> {
    const [newItem] = await db.insert(punchListItems).values({
      ...item,
      updatedAt: new Date()
    }).returning();
    return newItem;
  }

  async updatePunchListItem(id: string, item: Partial<InsertPunchListItem>): Promise<PunchListItem> {
    const [updatedItem] = await db
      .update(punchListItems)
      .set({
        ...item,
        updatedAt: new Date()
      })
      .where(eq(punchListItems.id, id))
      .returning();
    return updatedItem;
  }

  async deletePunchListItem(id: string): Promise<void> {
    await db.delete(punchListItems).where(eq(punchListItems.id, id));
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

  // Activity tracking stub methods
  async getRecentActivity(limit = 10): Promise<any[]> {
    // TODO: Implement activity tracking table
    return [];
  }

  async logActivity(activity: {
    userId: string;
    action: string;
    description: string;
    entityType: string;
    entityId: string;
  }): Promise<void> {
    // TODO: Implement activity logging
    console.log('Activity logged:', activity);
  }

  // Plan operations
  async getPlanFilesByJobId(jobId: string): Promise<PlanFile[]> {
    return await db
      .select()
      .from(planFiles)
      .where(eq(planFiles.jobId, jobId))
      .orderBy(planFiles.createdAt);
  }

  async createPlanFile(planFileData: any): Promise<PlanFile> {
    const [planFile] = await db
      .insert(planFiles)
      .values(planFileData)
      .returning();
    return planFile;
  }

  async getPlanFile(planFileId: string): Promise<PlanFile | undefined> {
    const [planFile] = await db
      .select()
      .from(planFiles)
      .where(eq(planFiles.id, planFileId));
    return planFile;
  }

  async getJobWithDivisionAccess(jobId: string, userId: string): Promise<Job | undefined> {
    // Get the job and check division access
    const [jobWithAccess] = await db
      .select()
      .from(jobs)
      .leftJoin(users, eq(users.id, userId))
      .where(
        and(
          eq(jobs.id, jobId),
          // Admin can access all divisions, staff only their division
          sql`(${users.role} = 'admin' OR ${jobs.divisionId} = ${users.divisionId})`
        )
      );
    
    return jobWithAccess?.jobs;
  }

  async getPlanFileWithDivisionAccess(planFileId: string, userId: string): Promise<PlanFile | undefined> {
    // Get the plan file and check division access via job
    const [plan] = await db
      .select()
      .from(planFiles)
      .leftJoin(jobs, eq(planFiles.jobId, jobs.id))
      .leftJoin(users, eq(users.id, userId))
      .where(
        and(
          eq(planFiles.id, planFileId),
          // Admin can access all divisions, staff only their division
          sql`(${users.role} = 'admin' OR ${jobs.divisionId} = ${users.divisionId})`
        )
      );
    
    return plan?.plan_files;
  }

  async getPlanAnnotations(planFileId: string): Promise<PlanAnnotation[]> {
    return await db
      .select()
      .from(planAnnotations)
      .where(
        and(
          eq(planAnnotations.planFileId, planFileId),
          eq(planAnnotations.isDeleted, false)
        )
      )
      .orderBy(planAnnotations.updatedAt);
  }

  async upsertPlanAnnotations(planFileId: string, annotations: any[], userId: string): Promise<PlanAnnotation[]> {
    const results: PlanAnnotation[] = [];
    
    for (const annotation of annotations) {
      const { id, page, dataJson } = annotation;
      
      if (id) {
        // Update existing annotation
        const [updated] = await db
          .update(planAnnotations)
          .set({
            dataJson,
            createdBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(planAnnotations.id, id))
          .returning();
        
        if (updated) results.push(updated);
      } else {
        // Create new annotation
        const [created] = await db
          .insert(planAnnotations)
          .values({
            planFileId,
            page,
            dataJson,
            createdBy: userId,
          })
          .returning();
        
        results.push(created);
      }
    }
    
    return results;
  }

  async getPlanScales(planFileId: string): Promise<PlanScale[]> {
    return await db
      .select()
      .from(planScales)
      .where(eq(planScales.planFileId, planFileId))
      .orderBy(planScales.page, planScales.createdAt);
  }

  async upsertPlanScale(planFileId: string, page: number, pixelPerUnit: number, unit: string, userId: string): Promise<PlanScale> {
    // Check if scale exists for this plan file and page
    const [existing] = await db
      .select()
      .from(planScales)
      .where(
        and(
          eq(planScales.planFileId, planFileId),
          eq(planScales.page, page)
        )
      );

    if (existing) {
      // Update existing scale
      const [updated] = await db
        .update(planScales)
        .set({
          pixelPerUnit: pixelPerUnit.toString(),
          unit,
          createdBy: userId,
          createdAt: new Date(),
        })
        .where(eq(planScales.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new scale
      const [created] = await db
        .insert(planScales)
        .values({
          planFileId,
          page,
          pixelPerUnit: pixelPerUnit.toString(),
          unit,
          createdBy: userId,
        })
        .returning();
      
      return created;
    }
  }

  // Document operations
  async listDocuments(leadId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.leadId, leadId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(data)
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db
      .delete(documents)
      .where(eq(documents.id, id));
  }
}

export const storage = new DatabaseStorage();