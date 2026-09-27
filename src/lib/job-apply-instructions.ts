/**
 * Careers role details should send applicants to the on-site form.
 * `/careers#application` is the heading above that form on the listing page.
 * The Apply button selects the role in page state.
 */
export const CAREERS_APPLICATION_HREF = '/careers#application'

type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  fields?: { url?: string; linkType?: string; newTab?: boolean }
  [key: string]: unknown
}

type LexicalDescription = {
  root: {
    children: LexicalNode[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

const textNode = (text: string): LexicalNode => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

function plainText(node: LexicalNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (!Array.isArray(node.children)) return ''
  return node.children.map(plainText).join('')
}

function urlsIn(node: LexicalNode, found: string[] = []): string[] {
  const url = node.fields?.url
  if (typeof url === 'string') found.push(url)
  if (Array.isArray(node.children)) {
    for (const child of node.children) urlsIn(child, found)
  }
  return found
}

function normalized(node: LexicalNode): string {
  return plainText(node).replace(/\s+/g, ' ').trim().toLowerCase()
}

export function isApplicationFormHref(url: string): boolean {
  const value = url.trim()
  if (value === CAREERS_APPLICATION_HREF || value === '#application') return true
  try {
    const parsed = new URL(value, 'https://www.highdesertpm.com')
    return parsed.pathname === '/careers' && parsed.hash === '#application'
  } catch {
    return false
  }
}

function hasApplicationFormLink(node: LexicalNode): boolean {
  return urlsIn(node).some(isApplicationFormHref)
}

function isBlank(node: LexicalNode): boolean {
  return node.type === 'paragraph' && normalized(node) === ''
}

function isHowToApplyLabel(node: LexicalNode): boolean {
  if (node.type !== 'paragraph' && node.type !== 'heading') return false
  return normalized(node).replace(/:$/, '') === 'how to apply'
}

function isEmailResumeInstruction(node: LexicalNode): boolean {
  const text = normalized(node)
  const urls = urlsIn(node).map(url => url.toLowerCase())
  const mailtoInfo = urls.some(url => url.startsWith('mailto:info@highdesertpm.com'))
    || text.includes('info@highdesertpm.com')
  if (/e-?mail (your|a|us your) r[eé]sum[eé]/.test(text)) return true
  if (!mailtoInfo) return false
  return /r[eé]sum[eé]|subject line/.test(text)
    || /(send|submit|forward).{0,40}r[eé]sum[eé]/.test(text)
}

function isReviewOpenRoles(node: LexicalNode): boolean {
  const text = normalized(node)
  if (!text.includes('review open roles')) return false
  return text.includes('career') || urlsIn(node).some(url => url.toLowerCase().includes('/careers'))
}

/** Older form wording with no link to the application heading. */
function isLegacyFormInstruction(node: LexicalNode): boolean {
  if (hasApplicationFormLink(node)) return false
  const text = normalized(node)
  if (text.includes('application form below')) return true
  return /\bselect\b/.test(text) && text.includes('application form')
}

function isApplyInstruction(node: LexicalNode): boolean {
  return isEmailResumeInstruction(node) || isLegacyFormInstruction(node) || isReviewOpenRoles(node)
}

function applyParagraph(roleTitle: string): LexicalNode {
  const title = roleTitle.trim() || 'this role'
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textStyle: '',
    textFormat: 0,
    children: [
      textNode('Fill out the '),
      {
        type: 'link',
        version: 3,
        direction: 'ltr',
        format: '',
        indent: 0,
        fields: { linkType: 'custom', url: CAREERS_APPLICATION_HREF, newTab: false },
        children: [textNode('application form')],
      },
      textNode(` on our careers page, and select ${title} in the form.`),
    ],
  }
}

function asDescription(value: unknown): LexicalDescription | null {
  let parsed = value
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return null
    }
  }
  if (!parsed || typeof parsed !== 'object') return null
  const root = (parsed as { root?: { children?: unknown } }).root
  if (!root || !Array.isArray(root.children)) return null
  return parsed as LexicalDescription
}

/**
 * Replace "How to apply" instructions that email a résumé to info@, and older
 * unlinked form sentences, with one linked instruction. Other sections,
 * including the equal-opportunity line, stay in place. Unchanged descriptions
 * are returned as the same object.
 */
export function rewriteJobApplyInstructions<T>(description: T, roleTitle: string): T {
  const doc = asDescription(description)
  if (!doc) return description
  const children = doc.root.children
  const next: LexicalNode[] = []
  let changed = false
  let index = 0

  while (index < children.length) {
    const node = children[index]
    if (isHowToApplyLabel(node)) {
      next.push(node)
      index += 1
      const block: LexicalNode[] = []
      while (index < children.length && (isBlank(children[index]) || isApplyInstruction(children[index]))) {
        block.push(children[index])
        index += 1
      }
      if (block.some(isApplyInstruction)) {
        next.push(applyParagraph(roleTitle))
        changed = true
      } else {
        next.push(...block)
      }
      continue
    }

    if (isEmailResumeInstruction(node)) {
      index += 1
      while (index < children.length && (isBlank(children[index]) || isReviewOpenRoles(children[index]) || isEmailResumeInstruction(children[index]))) {
        index += 1
      }
      next.push(applyParagraph(roleTitle))
      changed = true
      continue
    }

    next.push(node)
    index += 1
  }

  if (!changed) return description
  return { ...doc, root: { ...doc.root, children: next } } as T
}
