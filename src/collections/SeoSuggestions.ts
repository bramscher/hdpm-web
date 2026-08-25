import type { CollectionConfig } from 'payload'

/**
 * Suggestions produced by the SEO agent (api/cron/seo-agent). Human-in-the-
 * loop: the agent writes `pending` suggestions; an admin flips status to
 * `approved`, and the afterChange hook applies the change to the target
 * document and marks it `applied`. Four weeks later the agent measures the
 * result and records the outcome, which feeds its future suggestions.
 */
export const SeoSuggestions: CollectionConfig = {
  slug: 'seo-suggestions',
  admin: {
    useAsTitle: 'pagePath',
    defaultColumns: ['pagePath', 'field', 'status', 'outcome', 'createdAt'],
    group: 'SEO',
    description:
      'Set a suggestion’s status to "Applied" to write it onto the page (or use "Apply All Pending" on the Automations page). Outcomes are measured automatically ~4 weeks after applying.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'pagePath', type: 'text', required: true, index: true },
    {
      name: 'target',
      type: 'group',
      admin: { description: 'Which CMS document this suggestion edits' },
      fields: [
        {
          name: 'collection',
          type: 'select',
          options: [
            { label: 'Pages', value: 'pages' },
            { label: 'Posts', value: 'posts' },
            { label: 'Market Areas', value: 'market-areas' },
          ],
        },
        { name: 'docId', type: 'text' },
      ],
    },
    {
      name: 'field',
      type: 'select',
      required: true,
      options: [
        { label: 'SEO Title', value: 'seoTitle' },
        { label: 'SEO Description', value: 'seoDescription' },
        { label: 'Content (advisory only)', value: 'content' },
      ],
    },
    { name: 'currentValue', type: 'textarea' },
    { name: 'suggestedValue', type: 'textarea', required: true },
    {
      name: 'rationale',
      type: 'textarea',
      admin: { description: 'Why the agent believes this will improve rankings' },
    },
    {
      name: 'targetQueries',
      type: 'array',
      fields: [{ name: 'query', type: 'text', required: true }],
    },
    {
      name: 'metricsBefore',
      type: 'group',
      admin: { description: '28-day GSC metrics at suggestion time' },
      fields: [
        { name: 'clicks', type: 'number' },
        { name: 'impressions', type: 'number' },
        { name: 'ctr', type: 'number' },
        { name: 'position', type: 'number' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Applied (writes to the page)', value: 'applied' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Set to "Applied" to write the suggested value onto the page.',
      },
    },
    { name: 'appliedAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'metricsAfter',
      type: 'group',
      admin: { description: '28-day GSC metrics measured after applying' },
      fields: [
        { name: 'clicks', type: 'number' },
        { name: 'impressions', type: 'number' },
        { name: 'ctr', type: 'number' },
        { name: 'position', type: 'number' },
      ],
    },
    {
      name: 'outcome',
      type: 'select',
      options: [
        { label: 'Improved', value: 'improved' },
        { label: 'No change', value: 'no_change' },
        { label: 'Worse', value: 'worse' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        // Applying == setting status to "Applied". Do the page write in the
        // SAME save (beforeChange, with `req`) so it shares this save's
        // transaction — an out-of-transaction write to the same/other row
        // deadlocks on Postgres and silently fails. The admin form submits
        // every field, but fall back to originalDoc for partial (API/bulk)
        // updates that only send `status`.
        const becomingApplied =
          data.status === 'applied' && originalDoc?.status !== 'applied'
        if (!becomingApplied) return data

        // Stamp when it was applied regardless of what kind of suggestion it is.
        data.appliedAt = new Date().toISOString()

        const field = data.field ?? originalDoc?.field
        const target = data.target ?? originalDoc?.target
        const suggestedValue = data.suggestedValue ?? originalDoc?.suggestedValue
        const pagePath = data.pagePath ?? originalDoc?.pagePath

        // Content suggestions are advisory, and a suggestion with no target has
        // nothing to write — mark them applied without touching a page.
        if (field === 'content' || !target?.collection || !target?.docId) {
          req.payload.logger.info(
            `[seo-agent] marked ${field} applied (advisory, no page write) for ${pagePath}`,
          )
          return data
        }

        // docId is stored as a string (String(target.id)); coerce back to a
        // number for Postgres integer-PK collections so the update resolves.
        const targetId =
          typeof target.docId === 'string' && /^\d+$/.test(target.docId)
            ? Number(target.docId)
            : target.docId

        // `pages`/`posts` store SEO via the seo-plugin `meta` group;
        // `market-areas` has flat seoTitle/seoDescription.
        const targetData =
          target.collection === 'market-areas'
            ? { [field]: suggestedValue }
            : {
                meta: {
                  [field === 'seoTitle' ? 'title' : 'description']: suggestedValue,
                },
              }

        try {
          await req.payload.update({
            collection: target.collection,
            id: targetId,
            data: targetData,
            req, // join this save's transaction
          })
        } catch (err) {
          // Surface a clear, actionable error in the admin instead of a raw
          // stack — the save fails so the suggestion is NOT falsely marked
          // applied when the page didn't actually change.
          const detail = err instanceof Error ? err.message : String(err)
          throw new Error(
            `Couldn't write ${field} to ${target.collection}#${targetId} for ${pagePath}: ${detail}`,
          )
        }
        req.payload.logger.info(
          `[seo-agent] applied ${field} to ${target.collection}/${targetId} (${pagePath})`,
        )
        return data
      },
    ],
  },
}
