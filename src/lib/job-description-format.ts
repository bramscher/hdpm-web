import type { Job } from '@/payload-types'
import { rewriteJobApplyInstructions } from './job-apply-instructions'

const SECTION_LABELS = new Set([
  'about high desert property management', 'role overview', 'responsibilities',
  'requirements — must-haves', 'requirements - must-haves', 'nice-to-haves',
  'schedule and working conditions', 'compensation and benefits', 'how to apply',
])

/**
 * Display normalization. Does not write back to the CMS.
 * Email-a-résumé apply instructions are replaced for the public page; a migration
 * stores the same wording so the editor matches what candidates see.
 */
export function compactJobDescription(
  description: NonNullable<Job['description']>,
  roleTitle = '',
): NonNullable<Job['description']> {
  const source = rewriteJobApplyInstructions(description, roleTitle)
  const children = source.root.children.flatMap(node => {
    if (node.type !== 'paragraph' || !Array.isArray(node.children)) return [node]
    const inline = node.children as Array<{ type: string; text?: string }>
    if (inline.every(child => child.type === 'linebreak' || (child.type === 'text' && !child.text?.trim()))) return []
    const plainText = inline.every(child => child.type === 'text')
      ? inline.map(child => child.text || '').join('').trim().replace(/:$/, '').toLowerCase()
      : ''
    return [SECTION_LABELS.has(plainText) ? { ...node, type: 'heading', tag: 'h3' } : node]
  })
  return { ...source, root: { ...source.root, children } }
}
