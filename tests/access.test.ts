import assert from 'node:assert/strict'
import test from 'node:test'
import type { Access, FieldAccess, CollectionBeforeChangeHook } from 'payload'
import { Users } from '../src/collections/Users'
import { Posts } from '../src/collections/Posts'
import { Pages } from '../src/collections/Pages'
import { Media } from '../src/collections/Media'
import { Categories } from '../src/collections/Categories'
import { MarketAreas } from '../src/collections/MarketAreas'
import { Testimonials } from '../src/collections/Testimonials'
import { TeamMembers } from '../src/collections/TeamMembers'
import { LandingPages } from '../src/collections/LandingPages'
import { Campaigns } from '../src/collections/Campaigns'
import { SeoSuggestions } from '../src/collections/SeoSuggestions'
import { Leads } from '../src/collections/Leads'
import { CampaignVisits } from '../src/collections/CampaignVisits'
import { ListingGeocodes } from '../src/collections/ListingGeocodes'

function args(role?: string) {
  return { req: { user: role ? { id: 7, role } : null } } as Parameters<Access>[0]
}

test('only admins can create, delete, or unlock accounts', async () => {
  for (const operation of ['create', 'delete', 'unlock'] as const) {
    for (const role of [undefined, 'viewer', 'editor', 'api']) {
      assert.equal(await Users.access![operation]!(args(role)), false)
    }
    assert.equal(await Users.access![operation]!(args('admin')), true)
  }
})

test('non-admin account edits are constrained to self and cannot change roles', async () => {
  const roleField = Users.fields.find((field) => 'name' in field && field.name === 'role')!
  assert.ok('access' in roleField)
  for (const role of ['viewer', 'editor', 'api']) {
    assert.deepEqual(await Users.access!.update!(args(role)), { id: { equals: 7 } })
    for (const operation of ['create', 'update'] as const) {
      assert.equal(await roleField.access![operation]!(args(role) as Parameters<FieldAccess>[0]), false)
    }
  }
  assert.equal(await Users.access!.update!(args()), false)
  assert.equal(await Users.access!.update!(args('admin')), true)
  assert.equal(await roleField.access!.update!(args('admin') as Parameters<FieldAccess>[0]), true)
})

test('SSO provisioning remains viewer; existing SSO roles are preserved; first local user becomes admin', async () => {
  const hook = Users.hooks!.beforeChange![0]
  const invoke = (operation: string, data: object, totalDocs: number) => hook({
    operation, data,
    req: { user: null, payload: { count: async () => ({ totalDocs }) } },
  } as unknown as Parameters<CollectionBeforeChangeHook>[0])
  assert.equal((await invoke('create', { sub: 'microsoft-id', role: 'admin' }, 0)).role, 'viewer')
  assert.equal((await invoke('update', { sub: 'microsoft-id', role: 'admin' }, 1)).role, 'admin')
  assert.equal((await invoke('create', { role: 'editor' }, 0)).role, 'admin')
  assert.equal((await invoke('create', { role: 'editor' }, 1)).role, 'editor')
})

test('content collections deny anonymous and viewer writes but preserve editor and API publishing', async () => {
  for (const collection of [Posts, Pages, Media, Categories, MarketAreas, Testimonials, TeamMembers, LandingPages, Campaigns, SeoSuggestions]) {
    for (const operation of ['create', 'update', 'delete'] as const) {
      for (const role of [undefined, 'viewer']) {
        assert.equal(await collection.access![operation]!(args(role)), false, `${collection.slug}: ${operation}`)
      }
      for (const role of ['admin', 'editor', 'api']) {
        assert.equal(await collection.access![operation]!(args(role)), true, `${collection.slug}: ${operation}`)
      }
    }
  }
})

test('anonymous callers cannot write arbitrary CRM fields; viewers cannot delete measurements', async () => {
  assert.equal(await Leads.access!.create!(args()), false)
  assert.equal(await Leads.access!.create!(args('viewer')), false)
  assert.equal(await Leads.access!.create!(args('editor')), true)
  for (const collection of [CampaignVisits, ListingGeocodes]) {
    assert.equal(await collection.access!.delete!(args('viewer')), false)
    assert.equal(await collection.access!.delete!(args('editor')), true)
  }
})

test('published content and media remain publicly readable', async () => {
  assert.equal(await Media.access!.read!(args()), true)
  for (const collection of [Posts, Pages, MarketAreas, LandingPages]) {
    assert.deepEqual(await collection.access!.read!(args()), { status: { equals: 'published' } })
  }
})
