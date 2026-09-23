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
