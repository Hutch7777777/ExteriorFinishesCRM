import { db } from '../server/db'
import { users, divisions, customers, jobs, estimates } from '../shared/schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Starting database seeding...')

  try {
    // Get environment variables with defaults for seeding
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@exteriorfinishes.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...')
    await db.delete(estimates)
    await db.delete(jobs)
    await db.delete(customers)
    await db.delete(users)
    await db.delete(divisions)

    // Seed divisions
    console.log('📁 Creating divisions...')
    const [mfncDivision, sfncDivision, rrDivision] = await db.insert(divisions).values([
      {
        key: 'mfnc',
        name: 'Multi-Family New Construction'
      },
      {
        key: 'sfnc', 
        name: 'Single-Family New Construction'
      },
      {
        key: 'rr',
        name: 'R&R'
      }
    ]).returning()

    // Hash the admin password
    console.log('🔐 Creating admin user...')
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Seed admin user
    const [adminUser] = await db.insert(users).values([
      {
        email: adminEmail,
        passwordHash: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        divisionId: null, // Admin can access all divisions
      }
    ]).returning()

    // Seed staff users for each division
    console.log('👥 Creating staff users...')
    const [mfncStaff, sfncStaff, rrStaff] = await db.insert(users).values([
      {
        email: 'mfnc.staff@exteriorfinishes.com',
        passwordHash: await bcrypt.hash('staff123', 12),
        name: 'MFNC Staff Member',
        role: 'staff',
        divisionId: mfncDivision.id,
      },
      {
        email: 'sfnc.staff@exteriorfinishes.com',
        passwordHash: await bcrypt.hash('staff123', 12),
        name: 'SFNC Staff Member',
        role: 'staff',
        divisionId: sfncDivision.id,
      },
      {
        email: 'rr.staff@exteriorfinishes.com',
        passwordHash: await bcrypt.hash('staff123', 12),
        name: 'RR Staff Member',
        role: 'staff',
        divisionId: rrDivision.id,
      }
    ]).returning()

    // Seed sample customers
    console.log('🏢 Creating sample customers...')
    const [mfncCustomer1, mfncCustomer2, sfncCustomer1, rrCustomer1] = await db.insert(customers).values([
      {
        divisionId: mfncDivision.id,
        name: 'Sunrise Apartments LLC',
        email: 'contact@sunriseapts.com',
        phone: '(555) 123-4567',
        addressJson: { street: '123 Main St', city: 'Chicago', state: 'IL', zip: '60601' },
        notes: 'Large multi-family complex, prefers vinyl siding'
      },
      {
        divisionId: mfncDivision.id,
        name: 'Metro Housing Partners',
        email: 'projects@metrohousing.com',
        phone: '(555) 234-5678',
        addressJson: { street: '456 Oak Ave', city: 'Chicago', state: 'IL', zip: '60602' },
        notes: 'Focus on energy-efficient materials'
      },
      {
        divisionId: sfncDivision.id,
        name: 'Johnson Family',
        email: 'mike.johnson@email.com',
        phone: '(555) 345-6789',
        addressJson: { street: '789 Pine St', city: 'Springfield', state: 'IL', zip: '62701' },
        notes: 'Building new single-family home, premium finishes'
      },
      {
        divisionId: rrDivision.id,
        name: 'Heritage Properties',
        email: 'repairs@heritageprops.com',
        phone: '(555) 456-7890',
        addressJson: { street: '321 Elm St', city: 'Peoria', state: 'IL', zip: '61601' },
        notes: 'Historic building renovation project'
      }
    ]).returning()

    // Seed sample jobs
    console.log('💼 Creating sample jobs...')
    const [job1, job2, job3, job4] = await db.insert(jobs).values([
      {
        customerId: mfncCustomer1.id,
        divisionId: mfncDivision.id,
        status: 'draft',
        siteAddressJson: { street: '123 Main St', city: 'Chicago', state: 'IL', zip: '60601' },
        createdBy: mfncStaff.id
      },
      {
        customerId: mfncCustomer2.id,
        divisionId: mfncDivision.id,
        status: 'active',
        siteAddressJson: { street: '456 Oak Ave', city: 'Chicago', state: 'IL', zip: '60602' },
        createdBy: mfncStaff.id
      },
      {
        customerId: sfncCustomer1.id,
        divisionId: sfncDivision.id,
        status: 'draft',
        siteAddressJson: { street: '789 Pine St', city: 'Springfield', state: 'IL', zip: '62701' },
        createdBy: sfncStaff.id
      },
      {
        customerId: rrCustomer1.id,
        divisionId: rrDivision.id,
        status: 'closed',
        siteAddressJson: { street: '321 Elm St', city: 'Peoria', state: 'IL', zip: '61601' },
        createdBy: rrStaff.id
      }
    ]).returning()

    // Seed sample estimates
    console.log('💰 Creating sample estimates...')
    await db.insert(estimates).values([
      {
        jobId: job1.id,
        status: 'draft',
        totalCents: 125000000, // $1,250,000
        linesJson: [
          { description: 'Vinyl siding installation', quantity: 5000, unitPrice: 15000, total: 75000000 },
          { description: 'Trim and finishing', quantity: 1, unitPrice: 50000000, total: 50000000 }
        ]
      },
      {
        jobId: job2.id,
        status: 'sent',
        totalCents: 98000000, // $980,000
        linesJson: [
          { description: 'Fiber cement siding', quantity: 4000, unitPrice: 20000, total: 80000000 },
          { description: 'Labor and materials', quantity: 1, unitPrice: 18000000, total: 18000000 }
        ]
      },
      {
        jobId: job3.id,
        status: 'approved',
        totalCents: 45000000, // $450,000
        linesJson: [
          { description: 'Premium vinyl siding', quantity: 2000, unitPrice: 18000, total: 36000000 },
          { description: 'Custom trim work', quantity: 1, unitPrice: 9000000, total: 9000000 }
        ]
      },
      {
        jobId: job4.id,
        status: 'approved',
        totalCents: 32000000, // $320,000
        linesJson: [
          { description: 'Restoration siding', quantity: 1500, unitPrice: 16000, total: 24000000 },
          { description: 'Historic preservation work', quantity: 1, unitPrice: 8000000, total: 8000000 }
        ]
      }
    ])

    console.log('✅ Database seeding completed successfully!')
    console.log('📋 Seeded data summary:')
    console.log(`   • 3 divisions (MFNC, SFNC, RR)`)
    console.log(`   • 4 users (1 admin, 3 staff)`)
    console.log(`   • 4 customers`)
    console.log(`   • 4 jobs`)
    console.log(`   • 4 estimates`)
    console.log('')
    console.log('🔑 Login credentials:')
    console.log(`   Admin: ${adminEmail} / ${adminPassword}`)
    console.log(`   MFNC Staff: mfnc.staff@exteriorfinishes.com / staff123`)
    console.log(`   SFNC Staff: sfnc.staff@exteriorfinishes.com / staff123`)
    console.log(`   RR Staff: rr.staff@exteriorfinishes.com / staff123`)

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

// Run the seeding function
seed()
  .catch(console.error)
  .finally(() => process.exit(0))