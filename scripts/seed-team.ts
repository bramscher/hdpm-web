/**
 * Seed team members from existing highdesertpm.com.
 *
 * Usage:
 *   npx tsx scripts/seed-team.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const TEAM_MEMBERS = [
  {
    name: 'Craig Bramscher',
    title: 'President',
    bio: 'Craig founded High Desert Property Management with a vision to bring technology-forward, owner-first management to Central Oregon. He oversees company strategy, technology investments, and key owner relationships across the portfolio.',
    order: 1,
  },
  {
    name: 'Jennifer Bertran',
    title: 'Property Manager',
    bio: 'Jennifer manages a large portfolio of residential properties across Central Oregon. She handles everything from tenant relations and lease negotiations to property inspections and owner communication, bringing years of local property management experience to every interaction.',
    order: 2,
  },
  {
    name: 'Mathew Free',
    title: 'Property Manager',
    bio: 'Mathew works directly with property owners and tenants to keep operations running smoothly. His focus areas include leasing, tenant screening, and ensuring properties are well-maintained and performing at their best.',
    order: 3,
  },
  {
    name: 'Penny Free',
    title: 'Property Manager',
    bio: 'Penny brings a detail-oriented approach to property management, handling day-to-day operations, move-in and move-out coordination, and owner reporting. She\'s known for her responsiveness and thoroughness with both tenants and owners.',
    order: 4,
  },
  {
    name: 'Cheryl Waterman',
    title: 'Maintenance Coordinator',
    bio: 'Cheryl coordinates all maintenance and repair work across the HDPM portfolio. She manages vendor relationships, schedules service calls, and ensures every maintenance request is resolved quickly and cost-effectively.',
    order: 5,
  },
  {
    name: 'Bianca Nyseth',
    title: 'Office Support',
    bio: 'Bianca keeps the HDPM office running efficiently, handling administrative tasks, tenant inquiries, and document management. She\'s often the first point of contact for anyone reaching out to the team.',
    order: 6,
  },
]

async function seed() {
  console.log('👥 Seeding team members...\n')

  const payload = await getPayload({ config })

  for (const member of TEAM_MEMBERS) {
    const existing = await payload.find({
      collection: 'team-members',
      where: { name: { equals: member.name } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      // Update existing
      await payload.update({
        collection: 'team-members',
        id: existing.docs[0].id,
        data: member,
      })
      console.log(`  ✓ Updated: ${member.name} (${member.title})`)
    } else {
      await payload.create({
        collection: 'team-members',
        data: member,
      })
      console.log(`  + Created: ${member.name} (${member.title})`)
    }
  }

  console.log('\n✅ Team seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
