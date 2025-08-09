import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  pgEnum,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const divisionTypeEnum = pgEnum('division_type', ['residential', 'commercial']);
export const jobStatusEnum = pgEnum('job_status', ['planning', 'in_progress', 'completed', 'cancelled']);
export const estimateStatusEnum = pgEnum('estimate_status', ['draft', 'sent', 'approved', 'rejected']);

// Divisions table
export const divisions = pgTable("divisions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: divisionTypeEnum("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  divisionId: uuid("division_id").references(() => divisions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  projectType: varchar("project_type", { length: 100 }).notNull(),
  status: jobStatusEnum("status").notNull().default('planning'),
  value: decimal("value", { precision: 12, scale: 2 }),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Estimates table
export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  jobId: uuid("job_id").references(() => jobs.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: estimateStatusEnum("status").notNull().default('draft'),
  validUntil: timestamp("valid_until"),
  sentDate: timestamp("sent_date"),
  approvedDate: timestamp("approved_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity log for tracking system events
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description").notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: uuid("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const customerRelations = relations(customers, ({ one, many }) => ({
  division: one(divisions, {
    fields: [customers.divisionId],
    references: [divisions.id],
  }),
  jobs: many(jobs),
  estimates: many(estimates),
}));

export const divisionRelations = relations(divisions, ({ many }) => ({
  customers: many(customers),
  jobs: many(jobs),
  estimates: many(estimates),
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
  estimates: many(estimates),
}));

export const estimateRelations = relations(estimates, ({ one }) => ({
  customer: one(customers, {
    fields: [estimates.customerId],
    references: [customers.id],
  }),
  division: one(divisions, {
    fields: [estimates.divisionId],
    references: [divisions.id],
  }),
  job: one(jobs, {
    fields: [estimates.jobId],
    references: [jobs.id],
  }),
}));

// Insert schemas
export const insertDivisionSchema = createInsertSchema(divisions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEstimateSchema = createInsertSchema(estimates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDivision = typeof insertDivisionSchema._type;
export type Division = typeof divisions.$inferSelect;

export type InsertCustomer = typeof insertCustomerSchema._type;
export type Customer = typeof customers.$inferSelect;

export type InsertJob = typeof insertJobSchema._type;
export type Job = typeof jobs.$inferSelect;

export type InsertEstimate = typeof insertEstimateSchema._type;
export type Estimate = typeof estimates.$inferSelect;

export type InsertActivityLog = typeof insertActivityLogSchema._type;
export type ActivityLog = typeof activityLog.$inferSelect;

// Extended types with relations
export type CustomerWithRelations = Customer & {
  division?: Division;
  jobs?: Job[];
  estimates?: Estimate[];
};

export type JobWithRelations = Job & {
  customer?: Customer;
  division?: Division;
  estimates?: Estimate[];
};

export type EstimateWithRelations = Estimate & {
  customer?: Customer;
  division?: Division;
  job?: Job;
};
