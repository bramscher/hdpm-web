import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import type {
  Adapter,
  GeneratedAdapter,
  GenerateURL,
  HandleDelete,
  HandleUpload,
  StaticHandler,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Plugin, UploadCollectionSlug, Config } from 'payload'
import path from 'path'

// ---------------------------------------------------------------------------
// Supabase Storage adapter for Payload CMS v3
//
// Replaces @payloadcms/storage-s3 with direct calls to the Supabase JS client,
// which only requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// Files are uploaded to the public "media" bucket.  The generateURL function
// returns a path-based URL (/api/media/file/<filename>) that is rewritten by
// next.config.ts to the real Supabase Storage public URL.  This keeps the
// origin consistent and avoids CORS/mixed-content issues.
// ---------------------------------------------------------------------------

interface SupabaseStorageOptions {
  /** Supabase Storage bucket name. @default "media" */
  bucket?: string
  /** Collections that should use this adapter */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>
  /** Whether to disable local storage @default true */
  disableLocalStorage?: boolean
  /** Whether the plugin is enabled @default true */
  enabled?: boolean
}

// Singleton so we don't create a new client per request
let _client: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'supabase-storage-adapter: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
    )
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  })
  return _client
}

// ---------------------------------------------------------------------------
// handleUpload – uploads the file buffer to Supabase Storage
// ---------------------------------------------------------------------------
function getHandleUpload(bucket: string): HandleUpload {
  return async ({ data, file }) => {
    const prefix = data?.prefix || ''
    const fileKey = path.posix.join(prefix, file.filename)

    const client = getSupabaseClient()
    const { error } = await client.storage.from(bucket).upload(fileKey, file.buffer, {
      contentType: file.mimeType,
      upsert: true, // overwrite if exists (re-upload / regenerated sizes)
      duplex: 'half',
    })

    if (error) {
      throw new Error(`Supabase Storage upload failed for "${fileKey}": ${error.message}`)
    }

    return data
  }
}

// ---------------------------------------------------------------------------
// handleDelete – removes the file from Supabase Storage
// ---------------------------------------------------------------------------
function getHandleDelete(bucket: string): HandleDelete {
  return async ({ doc: { prefix = '' }, filename }) => {
    const fileKey = path.posix.join(prefix, filename)
    const client = getSupabaseClient()

    const { error } = await client.storage.from(bucket).remove([fileKey])
    if (error) {
      // Log but don't throw – a missing file on delete is not critical
      console.warn(`Supabase Storage delete warning for "${fileKey}": ${error.message}`)
    }
  }
}

// ---------------------------------------------------------------------------
// generateURL – returns the path that next.config.ts rewrites to Supabase
// ---------------------------------------------------------------------------
function getGenerateURL(): GenerateURL {
  return ({ filename, prefix = '' }) => {
    const filePath = path.posix.join(prefix, filename)
    // This path is rewritten by next.config.ts:
    //   /api/media/file/:path* → {SUPABASE_URL}/storage/v1/object/public/media/:path*
    return `/api/media/file/${filePath}`
  }
}

// ---------------------------------------------------------------------------
// staticHandler – serves files directly from Supabase Storage when Payload's
// built-in static serving is invoked (admin panel preview, etc.)
// ---------------------------------------------------------------------------
function getStaticHandler(bucket: string, collection: import('payload').CollectionConfig): StaticHandler {
  return async (req, { params: { clientUploadContext, filename } }) => {
    try {
      const prefix = await getFilePrefix({
        clientUploadContext,
        collection,
        filename,
        req,
      })

      const fileKey = path.posix.join(prefix, filename)
      const client = getSupabaseClient()

      const { data, error } = await client.storage.from(bucket).download(fileKey)

      if (error || !data) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const headers = new Headers()
      headers.set('Content-Type', data.type || 'application/octet-stream')
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')

      if (data.type === 'image/svg+xml') {
        headers.set('Content-Security-Policy', "script-src 'none'")
      }

      return new Response(data, { status: 200, headers })
    } catch (err) {
      console.error('Supabase static handler error:', err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}

// ---------------------------------------------------------------------------
// The Adapter factory that cloud-storage plugin expects
// ---------------------------------------------------------------------------
function supabaseAdapter(bucket: string): Adapter {
  return ({ collection, prefix }) => {
    return {
      name: 'supabase',
      generateURL: getGenerateURL(),
      handleDelete: getHandleDelete(bucket),
      handleUpload: getHandleUpload(bucket),
      staticHandler: getStaticHandler(bucket, collection),
    } satisfies GeneratedAdapter
  }
}

// ---------------------------------------------------------------------------
// Public plugin function – drop-in replacement for s3Storage()
// ---------------------------------------------------------------------------
export function supabaseStorage(options: SupabaseStorageOptions): Plugin {
  const {
    bucket = 'media',
    collections,
    disableLocalStorage = true,
    enabled = true,
  } = options

  return (incomingConfig: Config): Config => {
    if (!enabled) {
      return incomingConfig
    }

    const adapter = supabaseAdapter(bucket)

    // Attach the adapter to every configured collection
    const collectionsWithAdapter = Object.entries(collections).reduce(
      (acc, [slug, collOptions]) => ({
        ...acc,
        [slug]: {
          ...(collOptions === true ? {} : collOptions),
          adapter,
          generateFileURL: ({ filename, prefix = '' }: { filename: string; prefix?: string }) => {
            const filePath = path.posix.join(prefix, filename)
            return `/api/media/file/${filePath}`
          },
        },
      }),
      {} as Record<string, CollectionOptions>,
    )

    // Disable local storage on the upload collections
    const config: Config = {
      ...incomingConfig,
      collections: (incomingConfig.collections || []).map((collection) => {
        if (!collectionsWithAdapter[collection.slug]) {
          return collection
        }
        return {
          ...collection,
          upload: {
            ...(typeof collection.upload === 'object' ? collection.upload : {}),
            disableLocalStorage,
          },
        }
      }),
    }

    return cloudStoragePlugin({
      collections: collectionsWithAdapter as Partial<Record<UploadCollectionSlug, CollectionOptions>>,
    })(config)
  }
}
