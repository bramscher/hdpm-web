import type { CollectionConfig } from 'payload'

/**
 * Cached lat/lng per listing address, filled on demand by the listings map
 * API so each address is geocoded exactly once. Keyed by the full address
 * string, so coordinates survive listing churn in the AppFolio sync.
 */
export const ListingGeocodes: CollectionConfig = {
  slug: 'listing-geocodes',
  admin: {
    group: 'Marketing',
    hidden: true, // pure cache — nothing to manage by hand
  },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'address', type: 'text', required: true, unique: true, index: true },
    { name: 'lat', type: 'number', required: true },
    { name: 'lng', type: 'number', required: true },
  ],
}
