import assert from 'node:assert/strict'
import test from 'node:test'
import { CAREERS_APPLICATION_HREF, isApplicationFormHref, rewriteJobApplyInstructions } from '../src/lib/job-apply-instructions'
import { compactJobDescription } from '../src/lib/job-description-format'

type Node = { type: string; version: number; text?: string; children?: Node[]; fields?: { url?: string; newTab?: boolean; linkType?: string }; [key: string]: unknown }

const text = (value: string): Node => ({
  type: 'text', text: value, format: 0, detail: 0, mode: 'normal', style: '', version: 1,
})

const autolink = (url: string, label: string): Node => ({
  type: 'autolink',
  fields: { url, linkType: 'custom' },
  format: '',
  indent: 0,
  version: 2,
  children: [text(label)],
  direction: null,
})

const paragraph = (children: Node[]): Node => ({
  type: 'paragraph', format: '', indent: 0, version: 1, children, direction: null, textStyle: '', textFormat: 0,
})

const blank = () => paragraph([])

const doc = (children: Node[]) => ({
  root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children },
})

function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const value = node as { type?: string; text?: string; children?: unknown[] }
  if (value.type === 'text') return value.text || ''
  return (value.children || []).map(nodeText).join('')
}

test('application form href accepts the careers form anchor only', () => {
  assert.equal(isApplicationFormHref('/careers#application'), true)
  assert.equal(isApplicationFormHref('#application'), true)
  assert.equal(isApplicationFormHref('https://www.highdesertpm.com/careers#application'), true)
  assert.equal(isApplicationFormHref('https://www.highdesertpm.com/careers'), false)
  assert.equal(isApplicationFormHref('mailto:info@highdesertpm.com'), false)
})

test('email resume instructions become a link to the careers form', () => {
  const source = doc([
    paragraph([text('Role overview')]),
    paragraph([text('Represent HDPM professionally in person, by phone, and by email.')]),
    paragraph([text('How to apply')]),
    paragraph([
      text('Email your resume to '),
      autolink('mailto:info@highdesertpm.com', 'info@highdesertpm.com'),
      text(' with the subject line Property Manager.'),
    ]),
    paragraph([
      text('You can also review open roles at '),
      autolink('https://www.highdesertpm.com/careers', 'https://www.highdesertpm.com/careers'),
    ]),
    paragraph([text('High Desert Property Management is an equal opportunity employer.')]),
  ])
  const before = JSON.stringify(source)
  const result = rewriteJobApplyInstructions(source, 'Property Manager')
  assert.notEqual(JSON.stringify(result), before)
  assert.equal(JSON.stringify(source), before)
  const children = result.root.children
  assert.equal(children.length, 5)
  assert.equal(nodeText(children[2]), 'How to apply')
  const instruction = children[3]
  assert.equal(
    nodeText(instruction),
    'Fill out the application form on our careers page, and select Property Manager in the form.',
  )
  const link = instruction.children?.find(child => child.type === 'link')
  assert.equal(link?.fields?.url, CAREERS_APPLICATION_HREF)
  assert.equal(link?.fields?.newTab, false)
  assert.equal(JSON.stringify(result).includes('info@highdesertpm.com'), false)
  assert.equal(JSON.stringify(result).includes('mailto:'), false)
  assert.equal(nodeText(children[1]), 'Represent HDPM professionally in person, by phone, and by email.')
  assert.equal(nodeText(children[4]), 'High Desert Property Management is an equal opportunity employer.')
})

test('blank lines around a combined email paragraph are removed and the equal-opportunity line stays', () => {
  const source = doc([
    paragraph([text('How to apply')]),
    blank(),
    paragraph([
      text('Email your resume to '),
      autolink('mailto:info@highdesertpm.com', 'info@highdesertpm.com'),
      text(' with the subject line Maintenance Technician. You can also review open roles at '),
      autolink('https://www.highdesertpm.com/careers', 'https://www.highdesertpm.com/careers'),
    ]),
    blank(),
    paragraph([text('High Desert Property Management is an equal opportunity employer.')]),
  ])
  const result = rewriteJobApplyInstructions(source, 'Maintenance Technician')
  assert.deepEqual(result.root.children.map(nodeText), [
    'How to apply',
    'Fill out the application form on our careers page, and select Maintenance Technician in the form.',
    'High Desert Property Management is an equal opportunity employer.',
  ])
})

test('bookkeeper form sentence is aligned and linked without adding an email address', () => {
  const source = doc([
    { type: 'heading', tag: 'h2', version: 1, children: [text('How to apply')], direction: 'ltr' },
    paragraph([text('Select Accounting Bookkeeper (AP/AR) in the application form below. Tell us about your QuickBooks experience, the AP/AR work you’ve handled, and whether you’ve used AppFolio. You can attach a résumé and an optional short video introduction using the form’s upload instructions.')]),
  ])
  const once = rewriteJobApplyInstructions(source, 'Accounting Bookkeeper (AP/AR)')
  const twice = rewriteJobApplyInstructions(once, 'Accounting Bookkeeper (AP/AR)')
  assert.equal(twice, once)
  assert.equal(
    once.root.children.map(nodeText).join('\n'),
    [
      'How to apply',
      'Fill out the application form on our careers page, and select Accounting Bookkeeper (AP/AR) in the form.',
    ].join('\n'),
  )
  assert.equal(JSON.stringify(once).includes('info@'), false)
  assert.equal(JSON.stringify(once).includes(CAREERS_APPLICATION_HREF), true)
})

test('display formatting keeps the form link and does not mutate stored content', () => {
  const source = doc([
    paragraph([text('How to apply')]),
    paragraph([text('Email your résumé to info@highdesertpm.com with the subject line Cleaning Technician.')]),
    paragraph([text('High Desert Property Management is an equal opportunity employer.')]),
  ])
  const before = JSON.stringify(source)
  const result = compactJobDescription(source, 'Cleaning Technician')
  assert.equal(JSON.stringify(source), before)
  assert.equal(result.root.children[0].type, 'heading')
  assert.equal(nodeText(result.root.children[1]), 'Fill out the application form on our careers page, and select Cleaning Technician in the form.')
  assert.equal(nodeText(result.root.children[2]), 'High Desert Property Management is an equal opportunity employer.')
})

test('descriptions without apply instructions are left untouched', () => {
  const source = doc([paragraph([text('Keep this description.')])])
  assert.equal(rewriteJobApplyInstructions(source, 'Landscape Technician'), source)
  assert.equal(rewriteJobApplyInstructions(null, 'Landscape Technician'), null)
})
