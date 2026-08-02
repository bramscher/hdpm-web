/**
 * Add team members Kennedy James, Alberto Flores, and Ashley Bessey
 * (confirmed by Craig 2026-08-02), and update the contact page office
 * hours to the correct 9:00 AM – 4:00 PM.
 *
 * Usage: npx tsx scripts/update-team-aug2026.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const NEW_MEMBERS = [
  {
    name: 'Kennedy James',
    title: 'Assistant Property Manager',
    bio: 'Kennedy supports the property management team with tenant communication, leasing coordination, and day-to-day operations across the portfolio. She keeps the details organized so owners and tenants always know where things stand.',
    order: 8,
  },
  {
    name: 'Alberto Flores',
    title: 'Maintenance Technician',
    bio: 'Alberto handles hands-on maintenance and repair work across HDPM-managed properties. From routine fixes to turn work between tenants, he keeps homes in great shape and gets jobs done right the first time.',
    order: 9,
  },
  {
    name: 'Ashley Bessey',
    title: 'Office Support',
    bio: 'Ashley keeps the Redmond office running smoothly — fielding calls, supporting owners and tenants, and making sure paperwork and scheduling stay on track for the whole team.',
    order: 10,
  },
]

async function run() {
  const payload = await getPayload({ config })

  for (const member of NEW_MEMBERS) {
    const existing = await payload.find({
      collection: 'team-members',
      where: { name: { equals: member.name } },
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.update({
        collection: 'team-members',
        id: existing.docs[0].id,
        data: member,
      })
      console.log(`  ✏️  Updated ${member.name}`)
    } else {
      await payload.create({ collection: 'team-members', data: member })
      console.log(`  ✨ Added ${member.name} — ${member.title}`)
    }
  }

  // Office hours: live site + Google Business Profile say 9–4
  const contact = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    limit: 1,
  })
  if (contact.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: contact.docs[0].id,
      data: {
        contactContent: {
          ...(contact.docs[0].contactContent || {}),
          officeHours: 'Monday – Friday, 9:00 AM – 4:00 PM',
        },
      } as never,
    })
    console.log('  🕓 Contact page office hours set to 9:00 AM – 4:00 PM')
  }

  console.log('✅ Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
