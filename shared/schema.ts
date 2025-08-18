import { sql, relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  pgEnum,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Session storage table for Replit Auth (required)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff']);
export const divisionKeyEnum = pgEnum('division_key', ['mfnc', 'sfnc', 'rr']);
export const jobStatusEnum = pgEnum('job_status', ['draft', 'active', 'closed', 'planning', 'in_progress', 'completed']);
export const estimateStatusEnum = pgEnum('estimate_status', ['draft', 'sent', 'approved', 'rejected']);
export const proposalStatusEnum = pgEnum('proposal_status', ['draft', 'sent', 'accepted', 'rejected', 'expired']);
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']);
export const logTypeEnum = pgEnum('log_type', ['progress', 'issue', 'completion', 'weather', 'safety']);
export const punchItemStatusEnum = pgEnum('punch_item_status', ['open', 'in_progress', 'completed', 'verified']);
export const punchItemPriorityEnum = pgEnum('punch_item_priority', ['low', 'medium', 'high', 'critical']);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: userRoleEnum("role").notNull().default('staff'),
  divisionId: uuid("division_id").references(() => divisions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_division_id").on(table.divisionId),
  index("idx_users_role").on(table.role),
]);

// Divisions table
export const divisions = pgTable("divisions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: divisionKeyEnum("key").unique().notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  addressJson: jsonb("address_json"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_customers_division_id").on(table.divisionId),
  index("idx_customers_email").on(table.email),
]);

// Jobs table
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  status: jobStatusEnum("status").notNull().default('draft'),
  siteAddressJson: jsonb("site_address_json"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_jobs_customer_id").on(table.customerId),
  index("idx_jobs_division_id").on(table.divisionId),
  index("idx_jobs_created_by").on(table.createdBy),
  index("idx_jobs_status").on(table.status),
]);

// Leads table - for sales pipeline management
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  name: varchar("name", { length: 200 }).notNull(), // Company/property name
  contact: varchar("contact", { length: 200 }).notNull(), // Contact person
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  status: leadStatusEnum("status").notNull().default('new'),
  value: integer("value_cents").notNull().default(0), // Estimated value in cents
  source: varchar("source", { length: 100 }), // Lead source (website, referral, etc.)
  projectType: varchar("project_type", { length: 200 }),
  timeline: varchar("timeline", { length: 100 }),
  budget: varchar("budget", { length: 100 }),
  assignedTo: uuid("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_leads_division_id").on(table.divisionId),
  index("idx_leads_status").on(table.status),
  index("idx_leads_assigned_to").on(table.assignedTo),
  index("idx_leads_created_by").on(table.createdBy),
  index("idx_leads_created_at").on(table.createdAt),
]);

// Estimates table - now properly placed after leads table
export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid("lead_id").references(() => leads.id), // Reference to leads
  jobId: uuid("job_id").references(() => jobs.id), // Made optional
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: estimateStatusEnum("status").notNull().default('draft'),
  totalCents: integer("total_cents").notNull().default(0),
  laborHours: numeric("labor_hours").default("0"),
  materialCosts: integer("material_costs_cents").default(0),
  equipmentCosts: integer("equipment_costs_cents").default(0),
  overheadPercentage: numeric("overhead_percentage").default("15"),
  profitMarginPercentage: numeric("profit_margin_percentage").default("20"),
  linesJson: jsonb("lines_json"), // Detailed line items
  notes: text("notes"),
  estimatedBy: uuid("estimated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_estimates_lead_id").on(table.leadId),
  index("idx_estimates_job_id").on(table.jobId),
  index("idx_estimates_status").on(table.status),
  index("idx_estimates_estimated_by").on(table.estimatedBy),
]);

// Contacts table
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  name: varchar("name", { length: 200 }).notNull(),
  company: varchar("company", { length: 200 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // vendor, subcontractor, supplier, internal, partner
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  specialty: varchar("specialty", { length: 200 }),
  rating: integer("rating").default(0),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_contacts_division_id").on(table.divisionId),
  index("idx_contacts_type").on(table.type),
  index("idx_contacts_email").on(table.email),
]);

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  division: one(divisions, {
    fields: [users.divisionId],
    references: [divisions.id],
  }),
  createdJobs: many(jobs),
  createdLeads: many(leads, { relationName: 'createdBy' }),
  assignedLeads: many(leads, { relationName: 'assignedTo' }),
}));

export const divisionRelations = relations(divisions, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  jobs: many(jobs),
  leads: many(leads),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  division: one(divisions, {
    fields: [customers.divisionId],
    references: [divisions.id],
  }),
  jobs: many(jobs),
}));



export const jobRelations = relations(jobs, ({ one, many }) => ({
  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),
  division: one(divisions, {
    fields: [jobs.divisionId],
    references: [divisions.id],
  }),
  createdByUser: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
  }),
  estimates: many(estimates),
  fieldLogs: many(fieldLogs),
  punchListItems: many(punchListItems),
}));

// Proposals table
export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  title: varchar("title", { length: 200 }).notNull(),
  homeowner: varchar("homeowner", { length: 200 }).notNull(),
  address: text("address").notNull(),
  dateCreated: timestamp("date_created").notNull().defaultNow(),
  validDays: integer("valid_days").notNull().default(60),
  status: proposalStatusEnum("status").notNull().default('draft'),
  
  // Project details
  projectDescription: text("project_description").notNull(),
  projectInclusions: jsonb("project_inclusions").notNull().default(sql`'[]'::jsonb`),
  
  // Pricing
  baseCostCents: integer("base_cost_cents").notNull().default(0),
  options: jsonb("options").notNull().default(sql`'[]'::jsonb`),
  
  // Exclusions
  projectExclusions: jsonb("project_exclusions").notNull().default(sql`'[]'::jsonb`),
  baseExclusions: jsonb("base_exclusions").notNull().default(sql`'[]'::jsonb`),
  
  // Insurance & company info
  insuranceLimits: text("insurance_limits"),
  additionalNotes: text("additional_notes"),
  
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_proposals_customer_id").on(table.customerId),
  index("idx_proposals_division_id").on(table.divisionId),
  index("idx_proposals_created_by").on(table.createdBy),
  index("idx_proposals_status").on(table.status),
]);

// Daily field logs table
export const fieldLogs = pgTable("field_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").notNull().references(() => jobs.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  logType: logTypeEnum("log_type").notNull().default('progress'),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  weatherConditions: varchar("weather_conditions", { length: 100 }),
  crewMembers: jsonb("crew_members").notNull().default(sql`'[]'::jsonb`),
  hoursWorked: integer("hours_worked"),
  photosJson: jsonb("photos_json").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_field_logs_job_id").on(table.jobId),
  index("idx_field_logs_created_by").on(table.createdBy),
  index("idx_field_logs_log_type").on(table.logType),
  index("idx_field_logs_created_at").on(table.createdAt),
]);

// Punch list items table
export const punchListItems = pgTable("punch_list_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").notNull().references(() => jobs.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 200 }),
  priority: punchItemPriorityEnum("priority").notNull().default('medium'),
  status: punchItemStatusEnum("status").notNull().default('open'),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by").references(() => users.id),
  photosJson: jsonb("photos_json").notNull().default(sql`'[]'::jsonb`),
  notesJson: jsonb("notes_json").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_punch_list_items_job_id").on(table.jobId),
  index("idx_punch_list_items_created_by").on(table.createdBy),
  index("idx_punch_list_items_assigned_to").on(table.assignedTo),
  index("idx_punch_list_items_status").on(table.status),
  index("idx_punch_list_items_priority").on(table.priority),
  index("idx_punch_list_items_due_date").on(table.dueDate),
]);

// Plan files table
export const planFiles = pgTable("plan_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").notNull().references(() => jobs.id),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  pages: integer("pages").notNull().default(1),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_plan_files_job_id").on(table.jobId),
  index("idx_plan_files_uploaded_by").on(table.uploadedBy),
]);

// Plan annotations table
export const planAnnotations = pgTable("plan_annotations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  planFileId: uuid("plan_file_id").notNull().references(() => planFiles.id),
  page: integer("page").notNull(),
  dataJson: jsonb("data_json").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
}, (table) => [
  index("idx_plan_annotations_plan_file_page").on(table.planFileId, table.page),
  index("idx_plan_annotations_created_by").on(table.createdBy),
]);

// Plan scales table  
export const planScales = pgTable("plan_scales", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  planFileId: uuid("plan_file_id").notNull().references(() => planFiles.id),
  page: integer("page").notNull(),
  pixelPerUnit: numeric("pixel_per_unit", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_plan_scales_plan_file_page").on(table.planFileId, table.page),
  index("idx_plan_scales_created_by").on(table.createdBy),
]);

// Documents table - for file storage per lead
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: 'cascade' }),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  objectPath: varchar("object_path", { length: 500 }).notNull(), // Path in object storage
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_documents_lead_id").on(table.leadId),
  index("idx_documents_uploaded_by").on(table.uploadedBy),
  index("idx_documents_created_at").on(table.createdAt),
]);

export const leadRelations = relations(leads, ({ one, many }) => ({
  division: one(divisions, {
    fields: [leads.divisionId],
    references: [divisions.id],
  }),
  createdByUser: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  assignedToUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  documents: many(documents),
  estimates: many(estimates),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  lead: one(leads, {
    fields: [documents.leadId],
    references: [leads.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const contactRelations = relations(contacts, ({ one }) => ({
  division: one(divisions, {
    fields: [contacts.divisionId],
    references: [divisions.id],
  }),
  createdByUser: one(users, {
    fields: [contacts.createdBy],
    references: [users.id],
  }),
}));

export const estimateRelations = relations(estimates, ({ one }) => ({
  lead: one(leads, {
    fields: [estimates.leadId],
    references: [leads.id],
  }),
  job: one(jobs, {
    fields: [estimates.jobId],
    references: [jobs.id],
  }),
  estimatedByUser: one(users, {
    fields: [estimates.estimatedBy],
    references: [users.id],
  }),
}));

export const proposalRelations = relations(proposals, ({ one }) => ({
  customer: one(customers, {
    fields: [proposals.customerId],
    references: [customers.id],
  }),
  division: one(divisions, {
    fields: [proposals.divisionId],
    references: [divisions.id],
  }),
  createdByUser: one(users, {
    fields: [proposals.createdBy],
    references: [users.id],
  }),
}));

export const fieldLogRelations = relations(fieldLogs, ({ one }) => ({
  job: one(jobs, {
    fields: [fieldLogs.jobId],
    references: [jobs.id],
  }),
  createdByUser: one(users, {
    fields: [fieldLogs.createdBy],
    references: [users.id],
  }),
}));

export const punchListItemRelations = relations(punchListItems, ({ one }) => ({
  job: one(jobs, {
    fields: [punchListItems.jobId],
    references: [jobs.id],
  }),
  createdByUser: one(users, {
    fields: [punchListItems.createdBy],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [punchListItems.assignedTo],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [punchListItems.completedBy],
    references: [users.id],
  }),
}));

export const planFileRelations = relations(planFiles, ({ one, many }) => ({
  job: one(jobs, {
    fields: [planFiles.jobId],
    references: [jobs.id],
  }),
  uploadedByUser: one(users, {
    fields: [planFiles.uploadedBy],
    references: [users.id],
  }),
  annotations: many(planAnnotations),
  scales: many(planScales),
}));

export const planAnnotationRelations = relations(planAnnotations, ({ one }) => ({
  planFile: one(planFiles, {
    fields: [planAnnotations.planFileId],
    references: [planFiles.id],
  }),
  createdByUser: one(users, {
    fields: [planAnnotations.createdBy],
    references: [users.id],
  }),
}));

export const planScaleRelations = relations(planScales, ({ one }) => ({
  planFile: one(planFiles, {
    fields: [planScales.planFileId],
    references: [planFiles.id],
  }),
  createdByUser: one(users, {
    fields: [planScales.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDivisionSchema = createInsertSchema(divisions).omit({ 
  id: true, 
  createdAt: true 
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ 
  id: true, 
  createdAt: true 
});

export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true, 
  createdAt: true 
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const insertLeadSchema = createInsertSchema(leads).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const insertContactSchema = createInsertSchema(contacts).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const insertProposalSchema = createInsertSchema(proposals).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const insertFieldLogSchema = createInsertSchema(fieldLogs).omit({
  id: true,
  createdAt: true
});

export const insertPunchListItemSchema = createInsertSchema(punchListItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlanFileSchema = createInsertSchema(planFiles).omit({
  id: true,
  createdAt: true
});

export const insertPlanAnnotationSchema = createInsertSchema(planAnnotations).omit({
  id: true,
  updatedAt: true
});

export const insertPlanScaleSchema = createInsertSchema(planScales).omit({
  id: true,
  createdAt: true
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof insertUserSchema._type;

export type Division = typeof divisions.$inferSelect;
export type InsertDivision = typeof insertDivisionSchema._type;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof insertCustomerSchema._type;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof insertJobSchema._type;

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = typeof insertEstimateSchema._type;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof insertLeadSchema._type;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof insertProposalSchema._type;

export type FieldLog = typeof fieldLogs.$inferSelect;
export type InsertFieldLog = typeof insertFieldLogSchema._type;

export type PunchListItem = typeof punchListItems.$inferSelect;
export type InsertPunchListItem = typeof insertPunchListItemSchema._type;

export type PlanFile = typeof planFiles.$inferSelect;
export type InsertPlanFile = typeof insertPlanFileSchema._type;

export type PlanAnnotation = typeof planAnnotations.$inferSelect;
export type InsertPlanAnnotation = typeof insertPlanAnnotationSchema._type;

export type PlanScale = typeof planScales.$inferSelect;
export type InsertPlanScale = typeof insertPlanScaleSchema._type;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof insertDocumentSchema._type;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof insertContactSchema._type;

// Extended types with relations
export type UserWithRelations = User & {
  division?: Division;
};

export type CustomerWithRelations = Customer & {
  division?: Division;
  jobs?: Job[];
};

export type JobWithRelations = Job & {
  customer?: Customer;
  division?: Division;
  createdByUser?: User;
  estimates?: Estimate[];
  fieldLogs?: FieldLog[];
  punchListItems?: PunchListItem[];
};

export type EstimateWithRelations = Estimate & {
  job?: JobWithRelations;
};

export type LeadWithRelations = Lead & {
  division?: Division;
  createdByUser?: User;
  assignedToUser?: User;
  documents?: Document[];
};

export type DocumentWithRelations = Document & {
  lead?: Lead;
  uploadedByUser?: User;
};

export type ContactWithRelations = Contact & {
  division?: Division;
  createdByUser?: User;
};

export type ProposalWithRelations = Proposal & {
  customer?: Customer;
  division?: Division;
  createdByUser?: User;
};

// For Replit Auth compatibility
export type UpsertUser = typeof users.$inferInsert;