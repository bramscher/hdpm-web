import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { getAuthjsInstance } from 'payload-authjs'

// payload-authjs requires the Payload instance to be created first; it reads the
// Auth.js config registered via authjsPlugin() in payload.config.ts.
const payload = await getPayload({ config: payloadConfig })

export const { handlers, signIn, signOut, auth } = getAuthjsInstance(payload)
