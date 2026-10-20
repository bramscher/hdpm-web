import assert from 'node:assert/strict'
import test from 'node:test'
import { classifySource, isAllowedSource, isOutOfState } from '../src/lib/blog-agent/sources'
import { editorialProblems, unsupportedClaims } from '../src/lib/blog-agent/editorial'
import { monthPlan } from '../src/lib/blog-agent/calendar'

test('competitor, brokerage and vendor blogs are never a source (drafts #55–57)', () => {
  for (const url of [
    'https://velocitypropertymanagement.com/blog/central-oregon-market-report-early-fall-2026',
    'https://www.buildium.com/resource/2027-property-management-industry-report',
    'https://www.stantonres.com/blog/Investment+Property+in+Central+Oregon',
    'https://example-seo-blog.com/bend-rentals',
    'not a url',
    undefined,
  ]) assert.equal(isAllowedSource(url), false, String(url))
})

test('government, newsroom and Reddit sources are classified', () => {
  assert.equal(classifySource('https://www.oregon.gov/ohcs/Pages/rent-stabilization.aspx'), 'primary')
  assert.equal(classifySource('https://olis.oregonlegislature.gov/liz/2027R1/Measures/Overview/SB1'), 'primary')
  assert.equal(classifySource('https://www.deschutes.org/assessor'), 'primary')
  assert.equal(classifySource('https://www.bendbulletin.com/localstate/story'), 'news')
  assert.equal(classifySource('https://ktvz.com/news/2026/10/01/story'), 'news')
  assert.equal(classifySource('https://reddit.com/r/Landlord/comments/abc'), 'reddit')
  // A lookalike host doesn't inherit trust.
  assert.equal(classifySource('https://notoregon.gov.example.com/page'), 'other')
  assert.equal(classifySource('https://fakebendbulletin.com/page'), 'other')
})

test('out-of-state Reddit posts are dropped (draft #54 was a Washington question)', () => {
  assert.equal(isOutOfState('Tenant/US-WA please weigh in on my lease renewal'), true)
  assert.equal(isOutOfState('Landlord [TX] income verification question'), true)
  assert.equal(isOutOfState('Landlord - CA security deposit timeline'), true)
  assert.equal(isOutOfState('Renting out my house in Florida, need advice'), true)
  assert.equal(isOutOfState('Question about lease renewals', 'We own a duplex in Spokane, Washington and the tenant wants to renew.'), true)
  assert.equal(isOutOfState('Landlord [OR] rent increase notice timing'), false)
  assert.equal(isOutOfState('Rent increase notice timing', 'Our rental is in Bend, moved here from California last year.'), false)
  assert.equal(isOutOfState('How do you handle frozen pipes in a vacant rental?'), false)
})

test('Reddit research rejects another state even when it is on-topic', async () => {
  const { acceptCandidate } = await import('../src/lib/blog-agent/research')
  const candidate = {
    title: 'Tenant/US-WA please weigh in on my lease renewal',
    body: 'Our landlord sent a lease renewal with a rent increase and new screening rules for the rental property. Is this normal for a lease renewal?',
    createdUTC: Math.floor(Date.now() / 1000) - 86400,
    subreddit: 'Landlord', upvotes: 50, comments: 30,
    permalink: '/r/Landlord/comments/example', relevanceLabel: 'Hot discussion',
  }
  assert.equal(acceptCandidate(candidate, 'both'), null)
  const oregon = acceptCandidate({ ...candidate, title: 'Landlord [OR] lease renewal and rent increase notice' }, 'both')
  assert.equal(oregon?.sourceKind, 'reddit')
})

test('drafts may not claim HDPM experience; the call-to-action may name HDPM', () => {
  assert.deepEqual(editorialProblems({ title: 't', body: 'Ready to talk? High Desert Property Management can help you plan your next lease.' }), [])
  for (const body of [
    'At High Desert Property Management, we see owners struggle with this every fall.',
    'In our experience, November vacancies run long.',
    'We’ve seen rents flatten across Bend.',
    'Our data shows April is the cheapest month.',
  ]) assert.equal(editorialProblems({ title: 't', body }).length, 1, body)
})

test('any unsupported fact-check claim blocks the draft', () => {
  assert.deepEqual(unsupportedClaims([{ claim: 'Cap is 9.5%', supported: true }]), [])
  assert.deepEqual(unsupportedClaims([{ claim: 'Cap is 9.5%', supported: true }, { claim: 'Bend median is $725,000', supported: false }]), ['Bend median is $725,000'])
  assert.equal(unsupportedClaims(undefined).length, 1)
})

test('month plan fills in the year for its searches', () => {
  const october = monthPlan(new Date('2026-10-20T12:00:00'))
  assert.ok(october.concerns.length > 0)
  assert.ok(october.searches.includes('Oregon maximum rent increase 2027'))
  for (let m = 0; m < 12; m++) {
    const plan = monthPlan(new Date(2026, m, 15))
    assert.ok(plan.searches.length > 0 && plan.searches.every((q) => !q.includes('{')), `month ${m}`)
  }
})
