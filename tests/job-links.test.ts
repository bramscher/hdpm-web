import assert from 'node:assert/strict'
import test from 'node:test'
import { isJobPostingURL } from '../src/lib/job-links'

test('accepts job postings from any HTTP or HTTPS website', () => {
  for (const url of ['https://www.indeed.com/viewjob?jk=123', 'https://bend.craigslist.org/job/123.html', 'https://jobs.example.com/roles/1', 'http://example.com/job']) {
    assert.equal(isJobPostingURL(url), true)
  }
})

test('rejects executable schemes, incomplete URLs, credentials, and malformed values', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '//example.com', '/jobs/1', 'indeed.com', 'https://', 'https://user:password@example.com', ' https://example.com', '', null, undefined]) {
    assert.equal(isJobPostingURL(url), false)
  }
})
