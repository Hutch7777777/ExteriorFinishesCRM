import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  pgEnum,
  uuid,
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
export const jobStatusEnum = pgEnum('job_status', ['draft', 'active', 'closed']);
export const estimateStatusEnum = pgEnum('estimate_status', ['draft', 'sent', 'approved', 'rejected']);

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

// Estimates table
export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").notNull().references(() => jobs.id),
  status: estimateStatusEnum("status").notNull().default('draft'),
  totalCents: integer("total_cents").notNull().default(0),
  linesJson: jsonb("lines_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_estimates_job_id").on(table.jobId),
  index("idx_estimates_status").on(table.status),
]);

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  division: one(divisions, {
    fields: [users.divisionId],
    references: [divisions.id],
  }),
  createdJobs: many(jobs),
}));

export const divisionRelations = relations(divisions, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  jobs: many(jobs),
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
}));

export const estimateRelations = relations(estimates, ({ one }) => ({
  job: one(jobs, {
    fields: [estimates.jobId],
    references: [jobs.id],
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
};

export type EstimateWithRelations = Estimate & {
  job?: JobWithRelations;
};

// For Replit Auth compatibility
export type UpsertUser = typeof users.$inferInsert;