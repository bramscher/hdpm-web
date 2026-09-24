import type { Job } from '@/payload-types'

const SECTION_LABELS = new Set([
  'about high desert property management', 'role overview', 'responsibilities',
  'requirements — must-haves', 'requirements - must-haves', 'nice-to-haves',
  'schedule and working conditions', 'compensation and benefits', 'how to apply',
])

/** Normalize display only; preserve the original CMS content and all substantive nodes. */
export function compactJobDescription(description: NonNullable<Job['description']>): NonNullable<Job['description']> {
  const children = description.root.children.flatMap(node => {
    if (node.type !== 'paragraph' || !Array.isArray(node.children)) return [node]
    const inline = node.children as Array<{ type: string; text?: string }>
    if (inline.every(child => child.type === 'linebreak' || (child.type === 'text' && !child.text?.trim()))) return []
    const plainText = inline.every(child => child.type === 'text')
      ? inline.map(child => child.text || '').join('').trim().replace(/:$/, '').toLowerCase()
      : ''
    return [SECTION_LABELS.has(plainText) ? { ...node, type: 'heading', tag: 'h3' } : node]
  })
  return { ...description, root: { ...description.root, children } }
}
