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
      'Approve a suggestion to apply it to the page. Outcomes are measured automatically ~4 weeks after applying.',
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
        { label: 'Approved (apply now)', value: 'approved' },
        { label: 'Applied', value: 'applied' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
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
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Apply on approve: pending/other → approved
        if (
          doc.status !== 'approved' ||
          previousDoc?.status === 'approved' ||
          doc.field === 'content' || // content suggestions are advisory, never auto-applied
          !doc.target?.collection ||
          !doc.target?.docId
        ) {
          return
        }
        try {
          // `pages` and `posts` render SEO fields from the seo-plugin's
          // `meta` group; `market-areas` has flat seoTitle/seoDescription.
          const data =
            doc.target.collection === 'market-areas'
              ? { [doc.field]: doc.suggestedValue }
              : {
                  meta: {
                    [doc.field === 'seoTitle' ? 'title' : 'description']:
                      doc.suggestedValue,
                  },
                }
          await req.payload.update({
            collection: doc.target.collection,
            id: doc.target.docId,
            data,
          })
          await req.payload.update({
            collection: 'seo-suggestions',
            id: doc.id,
            data: { status: 'applied', appliedAt: new Date().toISOString() },
          })
          req.payload.logger.info(
            `[seo-agent] applied ${doc.field} to ${doc.target.collection}/${doc.target.docId} (${doc.pagePath})`,
          )
        } catch (err) {
          req.payload.logger.error(
            `[seo-agent] failed to apply suggestion ${doc.id}: ${err instanceof Error ? err.message : err}`,
          )
        }
      },
    ],
  },
}
