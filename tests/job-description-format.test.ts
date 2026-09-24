import assert from 'node:assert/strict'
import test from 'node:test'
import { compactJobDescription } from '../src/lib/job-description-format'

test('job display removes blank spacer paragraphs and formats section labels without changing stored content', () => {
  const p = (children: unknown[]) => ({ type: 'paragraph', version: 1, children })
  const source = { root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: [
    p([{ type: 'text', text: 'Role overview' }]), p([{ type: 'linebreak' }]),
    p([{ type: 'text', text: '  ' }]), p([]),
    p([{ type: 'text', text: 'Keep this description.' }]),
    p([{ type: 'link', children: [{ type: 'text', text: 'Apply' }] }]),
    { type: 'list', version: 1, children: [{ type: 'listitem', children: [{ type: 'text', text: 'QuickBooks' }] }] },
  ] } }
  const before = JSON.stringify(source)
  const result = compactJobDescription(source)
  assert.equal(result.root.children.length, 4)
  assert.equal(result.root.children[0].type, 'heading')
  assert.deepEqual(result.root.children.slice(1), source.root.children.slice(4))
  assert.equal(JSON.stringify(source), before)
})
