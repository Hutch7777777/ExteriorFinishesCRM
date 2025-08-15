import { db } from '../server/db'
import { leads } from '../shared/schema'
import { sql } from 'drizzle-orm'

async function migrateNotes() {
  console.log('Starting notes migration...')
  
  try {
    // Get all leads with text-based notes
    const leadsWithNotes = await db
      .select()
      .from(leads)
      .where(sql`${leads.notes} IS NOT NULL AND ${leads.notes} != ''`)

    console.log(`Found ${leadsWithNotes.length} leads with existing notes to migrate`)

    for (const lead of leadsWithNotes) {
      if (typeof lead.notes === 'string' && lead.notes.trim()) {
        // Convert string note to array format
        const noteArray = [{
          id: Date.now().toString(),
          text: lead.notes,
          createdAt: lead.createdAt.toISOString(),
          createdBy: lead.createdBy,
          author: 'System Migration', // Default author for migrated notes
        }]

        await db
          .update(leads)
          .set({ notes: noteArray })
          .where(sql`${leads.id} = ${lead.id}`)

        console.log(`Migrated note for lead: ${lead.id}`)
      }
    }

    console.log('Notes migration completed successfully!')
  } catch (error) {
    console.error('Error during notes migration:', error)
    throw error
  }
}

// Run migration
migrateNotes().catch(console.error)