#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import ws from 'ws';
import { 
  users, 
  divisions, 
  customers, 
  jobs, 
  estimates,
  type InsertUser,
  type InsertDivision,
  type InsertCustomer,
  type InsertJob,
  type InsertEstimate
} from '../shared/schema';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const adminEmail = process.env.ADMIN_EMAIL || 'admin@exteriorfinishes.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  console.log('🌱 Seeding database...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema: { users, divisions, customers, jobs, estimates } });
  
  try {
    // Create divisions
    console.log('Creating divisions...');
    const divisionsData: InsertDivision[] = [
      { key: 'mfnc', name: 'Multi-Family New Construction' },
      { key: 'sfnc', name: 'Single-Family New Construction' },
      { key: 'rr', name: 'Repair & Renovation' }
    ];
    
    const createdDivisions = await db.insert(divisions).values(divisionsData).returning();
    console.log(`✅ Created ${createdDivisions.length} divisions`);
    
    // Create admin user
    console.log('Creating admin user...');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminUser: InsertUser = {
      email: adminEmail,
      passwordHash,
      name: 'System Administrator',
      role: 'admin',
      divisionId: null // Admin can access all divisions
    };
    
    const [createdAdmin] = await db.insert(users).values(adminUser).returning();
    console.log(`✅ Created admin user: ${createdAdmin.email}`);
    
    // Create sample customers for each division
    console.log('Creating sample customers...');
    const customersData: InsertCustomer[] = [];
    
    createdDivisions.forEach((division) => {
      const divisionCustomers: InsertCustomer[] = [
        {
          divisionId: division.id,
          name: `${division.key.toUpperCase()} Customer 1`,
          email: `customer1@${division.key}.example.com`,
          phone: '(555) 123-4567',
          addressJson: {
            street: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701'
          },
          notes: `Sample customer for ${division.name} division`
        },
        {
          divisionId: division.id,
          name: `${division.key.toUpperCase()} Customer 2`,
          email: `customer2@${division.key}.example.com`,
          phone: '(555) 234-5678',
          addressJson: {
            street: '456 Oak Avenue',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601'
          },
          notes: `Another sample customer for ${division.name}`
        },
        {
          divisionId: division.id,
          name: `${division.key.toUpperCase()} Customer 3`,
          email: `customer3@${division.key}.example.com`,
          phone: '(555) 345-6789',
          addressJson: {
            street: '789 Pine Road',
            city: 'Peoria',
            state: 'IL',
            zipCode: '61602'
          },
          notes: `Third sample customer for ${division.name}`
        }
      ];
      customersData.push(...divisionCustomers);
    });
    
    const createdCustomers = await db.insert(customers).values(customersData).returning();
    console.log(`✅ Created ${createdCustomers.length} customers`);
    
    // Create sample jobs
    console.log('Creating sample jobs...');
    const jobsData: InsertJob[] = [];
    
    createdCustomers.forEach((customer, index) => {
      const job: InsertJob = {
        customerId: customer.id,
        divisionId: customer.divisionId,
        status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'draft' : 'closed',
        siteAddressJson: customer.addressJson,
        createdBy: createdAdmin.id
      };
      jobsData.push(job);
    });
    
    const createdJobs = await db.insert(jobs).values(jobsData).returning();
    console.log(`✅ Created ${createdJobs.length} jobs`);
    
    // Create sample estimates
    console.log('Creating sample estimates...');
    const estimatesData: InsertEstimate[] = [];
    
    createdJobs.forEach((job, index) => {
      const estimate: InsertEstimate = {
        jobId: job.id,
        status: index % 4 === 0 ? 'sent' : index % 4 === 1 ? 'approved' : index % 4 === 2 ? 'rejected' : 'draft',
        totalCents: (15000 + (index * 5000)) * 100, // $15,000 to $60,000 range
        linesJson: [
          {
            description: 'Exterior siding installation',
            quantity: 1,
            unitPrice: (10000 + (index * 3000)) * 100,
            total: (10000 + (index * 3000)) * 100
          },
          {
            description: 'Labor and materials',
            quantity: 1,
            unitPrice: (5000 + (index * 2000)) * 100,
            total: (5000 + (index * 2000)) * 100
          }
        ]
      };
      estimatesData.push(estimate);
    });
    
    const createdEstimates = await db.insert(estimates).values(estimatesData).returning();
    console.log(`✅ Created ${createdEstimates.length} estimates`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📧 Admin login: ${adminEmail}`);
    console.log(`🔒 Admin password: ${adminPassword}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);