/**
 * Update team members: fix Bianca's title, add Brody, refresh all bios.
 *
 * Usage:
 *   npx tsx scripts/update-team.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const TEAM_MEMBERS = [
  {
    name: 'Craig Bramscher',
    title: 'President',
    bio: 'Craig founded HDPM to bring a smarter, more transparent approach to property management in Central Oregon. He leads company strategy and technology adoption, and works directly with owners to make sure their investments are performing. When he\'s not in the office, he\'s usually somewhere on the west side with his family.',
    order: 1,
  },
  {
    name: 'Jennifer Bertran',
    title: 'Property Manager',
    bio: 'Jennifer has been managing properties in Central Oregon for years and knows the local rental market inside and out. She handles a large portfolio of homes across Bend, Redmond, and Sisters, and owners consistently praise her communication and attention to detail. She\'s the person tenants and owners call when they need something handled right.',
    order: 2,
  },
  {
    name: 'Mathew Free',
    title: 'Property Manager',
    bio: 'Mathew is hands-on with every property in his portfolio, from tenant screening and leasing to inspections and renewals. He\'s thorough, responsive, and takes pride in keeping properties in top condition. Owners appreciate his straightforward communication style and his knack for solving problems before they escalate.',
    order: 3,
  },
  {
    name: 'Penny Free',
    title: 'Property Manager',
    bio: 'Penny brings a sharp eye for detail to everything she does, whether it\'s coordinating a move-out, reviewing a lease, or walking a property. She\'s known for being organized and easy to work with, and she makes the move-in and move-out process as painless as possible for both tenants and owners.',
    order: 4,
  },
  {
    name: 'Cheryl Waterman',
    title: 'Maintenance Coordinator',
    bio: 'Cheryl is the hub of all maintenance activity at HDPM. She coordinates repairs, manages vendor relationships, and keeps track of every open work order across the portfolio. If something needs fixing, Cheryl makes sure the right person is on it quickly and the job gets done right the first time.',
    order: 5,
  },
  {
    name: 'Bianca Nyseth',
    title: 'Assistant Property Manager',
    bio: 'Bianca supports the property management team across the full range of daily operations, from tenant communication and lease processing to property inspections and owner updates. She\'s reliable, proactive, and keeps things moving behind the scenes so nothing falls through the cracks.',
    order: 6,
  },
  {
    name: 'Brody Bramscher',
    title: 'Inspector / Maintenance Technician',
    bio: 'Brody handles property inspections and hands-on maintenance work across the HDPM portfolio. He conducts move-in and move-out inspections, routine property checks, and tackles repair jobs directly. He\'s quick, capable, and takes care of properties like they\'re his own.',
    order: 7,
  },
]

async function update() {
  console.log('👥 Updating team members...\n')

  const payload = await getPayload({ config })

  for (const member of TEAM_MEMBERS) {
    const existing = await payload.find({
      collection: 'team-members',
      where: { name: { equals: member.name } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'team-members',
        id: existing.docs[0].id,
        data: member,
      })
      console.log(`  ✓ Updated: ${member.name} — ${member.title}`)
    } else {
      await payload.create({
        collection: 'team-members',
        data: member,
      })
      console.log(`  + Created: ${member.name} — ${member.title}`)
    }
  }

  console.log('\n✅ Team update complete!')
  process.exit(0)
}

update().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
