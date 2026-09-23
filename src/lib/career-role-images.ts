const roleImages = {
  'accounting-bookkeeper-ap-ar':
    'Bookkeeper reviewing an invoice at a wood desk beside a Mac in a bright Central Oregon office.',
  'property-manager':
    'Property manager checking a tablet outside a Central Oregon home with junipers and Cascade mountains beyond.',
  'office-assistant':
    'Office assistant working at a Mac desktop in a bright office overlooking high-desert landscaping.',
  'assistant-maintenance-coordinator':
    'Maintenance coordinator using a headset, notebook, and Mac to organize work orders.',
  'maintenance-technician':
    'Maintenance technician in work clothes carefully adjusting a rental home’s door hinge.',
  'landscape-technician':
    'Landscape technician wearing gloves and a sun hat tending native plants in Central Oregon.',
  'cleaning-technician':
    'Cleaning technician wearing gloves and a work polo wiping a bright rental-home kitchen counter.',
} as const

export function careerRoleImage(job: { slug: string; title: string }) {
  const titleSlug = job.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const role = (Object.keys(roleImages) as Array<keyof typeof roleImages>).find(
    (key) =>
      job.slug === key || job.slug.startsWith(`${key}-`) || titleSlug === key,
  )
  return role
    ? { src: `/images/careers/${role}.webp`, alt: roleImages[role] }
    : null
}
