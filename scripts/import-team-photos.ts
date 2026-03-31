/**
 * Download team headshots from highdesertpm.com and attach to team members.
 *
 * Usage:
 *   npx tsx scripts/import-team-photos.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const TEAM_PHOTOS: { name: string; url: string; filename: string }[] = [
  {
    name: 'Craig Bramscher',
    url: 'https://irp.cdn-website.com/0bb3c890/dms3rep/multi/cab200-f92dce29.jpg',
    filename: 'craig-bramscher.jpg',
  },
  {
    name: 'Jennifer Bertran',
    url: 'https://irp.cdn-website.com/0bb3c890/dms3rep/multi/Jen-5a21d04c.jpg',
    filename: 'jennifer-bertran.jpg',
  },
  {
    name: 'Mathew Free',
    url: 'https://irp.cdn-website.com/0bb3c890/dms3rep/multi/Matt.jpg',
    filename: 'mathew-free.jpg',
  },
  {
    name: 'Penny Free',
    url: 'https://irp.cdn-website.com/0bb3c890/dms3rep/multi/Penny.jpg',
    filename: 'penny-free.jpg',
  },
  {
    name: 'Cheryl Waterman',
    url: 'https://irp.cdn-website.com/0bb3c890/dms3rep/multi/Cheryl.jpg',
    filename: 'cheryl-waterman.jpg',
  },
]

async function importPhotos() {
  console.log('📸 Importing team headshots...\n')

  const payload = await getPayload({ config })

  for (const member of TEAM_PHOTOS) {
    // Find the team member
    const { docs } = await payload.find({
      collection: 'team-members',
      where: { name: { equals: member.name } },
      limit: 1,
    })

    if (docs.length === 0) {
      console.log(`  ⚠ Team member not found: ${member.name}`)
      continue
    }

    const teamMember = docs[0]

    // Skip if they already have a photo
    if (teamMember.photo) {
      console.log(`  ⏭ ${member.name} already has a photo`)
      continue
    }

    // Download the image
    console.log(`  ↓ Downloading ${member.name}...`)
    const res = await fetch(member.url)
    if (!res.ok) {
      console.log(`  ✗ Download failed: ${res.status}`)
      continue
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    // Upload to media collection
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `${member.name} - High Desert Property Management`,
      },
      file: {
        data: buffer,
        name: member.filename,
        mimetype: contentType,
        size: buffer.length,
      },
    })

    // Attach to team member
    await payload.update({
      collection: 'team-members',
      id: teamMember.id,
      data: {
        photo: media.id,
      },
    })

    console.log(`  ✓ ${member.name} - photo uploaded and linked`)
  }

  console.log('\n✅ Team photo import complete!')
  process.exit(0)
}

importPhotos().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
