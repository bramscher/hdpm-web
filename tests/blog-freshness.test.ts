import assert from 'node:assert/strict'
import test from 'node:test'
import { hasRecentEvidence, isRecentSource, RESEARCH_WINDOW_MS, researchDateRange, requireRecentEvidence, sourceDateFromReddit } from '../src/lib/blog-agent/freshness'
const now=Date.parse('2026-09-23T12:00:00Z')
test('hard 30-day cutoff rejects old, missing, invalid, and future source dates',()=>{
 assert.equal(isRecentSource(new Date(now-RESEARCH_WINDOW_MS).toISOString(),now),true)
 for(const date of [undefined,'','not a date',new Date(now-RESEARCH_WINDOW_MS-1).toISOString(),new Date(now+1).toISOString()]) assert.equal(isRecentSource(date,now),false)
})
test('a fresh title and URL alone cannot produce a draft; actual source text is required',()=>{
 const source={sourceUrl:'https://reddit.com/r/RentalInvesting/comments/example',sourcePublishedAt:'2026-09-12T12:00:00Z',sourceExcerpt:'A landlord is asking about outsourcing property condition checks and vendor coordination instead of paying for full-service property management.'}
 assert.equal(hasRecentEvidence(source,now),true)
 for(const change of [{sourceExcerpt:undefined},{sourceExcerpt:'[removed]'},{sourcePublishedAt:'2025-09-12'},{sourceUrl:'javascript:alert(1)'}]) assert.throws(()=>requireRecentEvidence({...source,...change},now))
})
test('provider date filters use a rolling window and Reddit timestamps remain intact',()=>{
 assert.deepEqual(researchDateRange(now),{start_date:'2026-08-24',end_date:'2026-09-23'})
 assert.equal(sourceDateFromReddit(now/1000),'2026-09-23T12:00:00.000Z')
 for(const n of [NaN,Infinity,0,-1,Number.MAX_VALUE])assert.equal(sourceDateFromReddit(n),undefined)
})

test('Reddit hot ranking cannot bypass age checks and source body survives research', async () => {
  const { acceptCandidate } = await import('../src/lib/blog-agent/research')
  const candidate = {
    title: 'Would you pay for this?',
    body: 'Property management for a landlord who wants help with inspections and turnover coordination instead of a full-service contract. Would rental property owners use these services?',
    createdUTC: Math.floor(Date.now() / 1000) - 86400,
    subreddit: 'RentalInvesting', upvotes: 1000, comments: 100,
    permalink: '/r/RentalInvesting/comments/example', relevanceLabel: 'Hot discussion',
  }
  const result = acceptCandidate(candidate, 'owners')
  assert.equal(result?.sourceExcerpt, candidate.body)
  assert.equal(result?.sourceDateBasis, 'published')
  assert.equal(acceptCandidate({ ...candidate, createdUTC: candidate.createdUTC - 31 * 86400 }, 'owners'), null)
  assert.equal(acceptCandidate({ ...candidate, body: '[removed]' }, 'owners'), null)
})

test('recent page timestamps do not rescue stale market overviews', async () => {
  const { hasStaleOverviewTitle, requireCurrentReportingPeriod } = await import('../src/lib/blog-agent/freshness')
  assert.equal(hasStaleOverviewTitle("Central Oregon Rental Market Trends: A 2025 Owner's Guide", now), true)
  assert.equal(hasStaleOverviewTitle('Central Oregon rental market overview 2025', now), true)
  assert.equal(hasStaleOverviewTitle('Rental market: 2025 vs 2026', now), false)
  assert.equal(hasStaleOverviewTitle('Home built in 2025: maintenance tips', now), false)
  const source = { title: '2025 rental market overview', sourceUrl: 'https://example.com/report', sourcePublishedAt: '2026-09-22', sourceExcerpt: 'A recently updated page describing last year’s rental market. '.repeat(4) }
  assert.equal(hasRecentEvidence(source, now), false)
  assert.throws(() => requireCurrentReportingPeriod({ approved: true, timeSensitive: true, reportingPeriodCurrent: true }, source.title, now))
  // Semantic review must also establish the month/quarter and underlying data,
  // even if the headline contains no year or has the current year pasted on it.
  for (const title of ['Latest rental market update', '2026 rental market overview']) {
    assert.throws(() => requireCurrentReportingPeriod({ approved: true, timeSensitive: true, reportingPeriodCurrent: false }, title, now))
    assert.throws(() => requireCurrentReportingPeriod({ approved: true }, title, now))
    assert.doesNotThrow(() => requireCurrentReportingPeriod({ approved: true, timeSensitive: true, reportingPeriodCurrent: true }, title, now))
  }
  assert.doesNotThrow(() => requireCurrentReportingPeriod({ approved: true, timeSensitive: false }, 'A recent discussion of maintenance services', now))
})
