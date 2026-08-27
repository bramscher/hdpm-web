/**
 * Roster change (2026-08): remove Jennifer Bertran, add Jayme Payne.
 *
 * Jayme has no headshot yet — she renders with the silhouette fallback on
 * /about, same as any team member without a photo.
 *
 * Usage:
 *   npx tsx scripts/update-team-2026-08.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const REMOVE = ['Jennifer Bertran']

const ADD = [
  {
    name: 'Jayme Payne',
    title: 'Maintenance and Property Management Assistant',
    // Placed after the current roster; the live DB has drifted from the seed
    // scripts (members are added/edited in the Payload admin), so this order
    // is chosen to sit at the end rather than to match any seed-script value.
    order: 11,
  },
]

async function run() {
  console.log('👥 Applying 2026-08 roster change...\n')

  const payload = await getPayload({ config })

  // Remove departing members
  for (const name of REMOVE) {
    const { docs } = await payload.find({
      collection: 'team-members',
      where: { name: { equals: name } },
      limit: 10,
    })

    if (docs.length === 0) {
      console.log(`  ⏭ Not found (already removed): ${name}`)
      continue
    }

    for (const doc of docs) {
      await payload.delete({ collection: 'team-members', id: doc.id })
      console.log(`  ✗ Removed: ${name}`)
    }
  }

  // Add / update new members (idempotent upsert keyed on name)
  for (const member of ADD) {
    const { docs } = await payload.find({
      collection: 'team-members',
      where: { name: { equals: member.name } },
      limit: 1,
    })

    if (docs.length > 0) {
      await payload.update({
        collection: 'team-members',
        id: docs[0].id,
        data: member,
      })
      console.log(`  ✓ Updated: ${member.name} — ${member.title}`)
    } else {
      await payload.create({ collection: 'team-members', data: member })
      console.log(`  + Created: ${member.name} — ${member.title}`)
    }
  }

  console.log('\n✅ Roster change complete!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
