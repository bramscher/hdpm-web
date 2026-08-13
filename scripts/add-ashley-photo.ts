/**
 * Attach a photo to Ashley Bessey's team-member bio.
 * Uploads a local image to the media collection and links it.
 *
 * Usage: npx tsx scripts/add-ashley-photo.ts /path/to/photo.jpeg
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const NAME = 'Ashley Bessey'
const SRC = process.argv[2] || '/Users/cab_1/Desktop/IMG_2990.jpeg'

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`ERR source image not found: ${SRC}`)
    process.exit(1)
  }
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'team-members',
    where: { name: { equals: NAME } },
    limit: 1,
  })
  const member = docs[0] as Record<string, unknown> | undefined
  if (!member) {
    console.error(`ERR team member not found: ${NAME}`)
    process.exit(1)
  }
  if (member.photo) {
    console.log(`OUT ⏭  ${NAME} already has a photo (id=${member.photo}) — skipped`)
    process.exit(0)
  }

  const buffer = fs.readFileSync(SRC)
  const ext = path.extname(SRC).toLowerCase()
  const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg'

  const media = await payload.create({
    collection: 'media',
    data: { alt: `${NAME} — High Desert Property Management` },
    file: {
      data: buffer,
      name: 'ashley-bessey.jpg',
      mimetype,
      size: buffer.length,
    },
  })
  console.log(`OUT uploaded media id=${media.id}`)

  await payload.update({
    collection: 'team-members',
    id: member.id as number,
    data: { photo: media.id },
  })
  console.log(`OUT ✅ linked photo to ${NAME} (member id=${member.id})`)
  process.exit(0)
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(1)
})
