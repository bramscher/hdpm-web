/**
 * Replace Ashley Bessey's team photo with a new image, and remove the
 * previously-linked media doc so the library doesn't accumulate orphans.
 *
 * Usage: npx tsx scripts/replace-ashley-photo.ts /path/to/photo.jpeg
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const NAME = 'Ashley Bessey'
const SRC = process.argv[2] || '/Users/cab_1/Desktop/IMG_2992.jpeg'

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
    depth: 0,
  })
  const member = docs[0] as Record<string, unknown> | undefined
  if (!member) {
    console.error(`ERR team member not found: ${NAME}`)
    process.exit(1)
  }
  const oldPhotoId = member.photo as number | null

  const buffer = fs.readFileSync(SRC)
  const ext = path.extname(SRC).toLowerCase()
  const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg'

  const media = await payload.create({
    collection: 'media',
    data: { alt: `${NAME} — High Desert Property Management` },
    file: {
      data: buffer,
      name: 'ashley-bessey-headshot.jpg',
      mimetype,
      size: buffer.length,
    },
  })
  console.log(`OUT uploaded new media id=${media.id}`)

  await payload.update({
    collection: 'team-members',
    id: member.id as number,
    data: { photo: media.id },
  })
  console.log(`OUT ✅ relinked ${NAME} (member id=${member.id}) → media ${media.id}`)

  if (oldPhotoId && oldPhotoId !== media.id) {
    try {
      await payload.delete({ collection: 'media', id: oldPhotoId })
      console.log(`OUT 🗑  deleted previous media id=${oldPhotoId}`)
    } catch (err) {
      console.log(`OUT ⚠️  could not delete old media ${oldPhotoId}: ${(err as Error).message}`)
    }
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(1)
})
