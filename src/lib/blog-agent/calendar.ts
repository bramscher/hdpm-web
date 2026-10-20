/**
 * What Central Oregon owners care about each month. Drives the Tavily news
 * searches (always restricted to trusted hosts) and tells the relevance triage
 * what "timely" means right now — a recently posted source alone isn't enough.
 */

export interface MonthPlan {
  /** Plain-language owner concerns this month, given to the triage step. */
  concerns: string[]
  /** News searches run against trusted hosts only. */
  searches: string[]
}

const PLANS: Record<number, MonthPlan> = {
  0: {
    concerns: ['1099s and owner tax documents', 'frozen pipes and snow load', 'Oregon legislative session preview'],
    searches: ['Oregon legislature {year} session housing rental bills', 'Bend snow ice frozen pipes rental homes'],
  },
  1: {
    concerns: ['Oregon legislative session rental bills', 'property tax and deductions', 'winter maintenance'],
    searches: ['Oregon legislature rental housing bill landlord', 'Deschutes County property tax'],
  },
  2: {
    concerns: ['spring turnover planning', 'legislative session outcomes', 'irrigation start-up'],
    searches: ['Oregon rental law bill passed landlords', 'Central Oregon irrigation season start'],
  },
  3: {
    concerns: ['spring leasing season', 'irrigation start-up', 'wildfire defensible space'],
    searches: ['Central Oregon wildfire defensible space homeowners', 'Bend rental housing news'],
  },
  4: {
    concerns: ['summer leasing peak', 'wildfire preparedness', 'new Oregon laws taking effect'],
    searches: ['Oregon new rental laws take effect landlords', 'Deschutes County wildfire season outlook'],
  },
  5: {
    concerns: ['wildfire season and smoke', 'summer move-ins', 'water restrictions'],
    searches: ['Central Oregon wildfire smoke homes', 'Bend water restrictions summer'],
  },
  6: {
    concerns: ['wildfire season', 'heat and cooling', 'peak leasing'],
    searches: ['Central Oregon wildfire evacuation levels homes', 'Oregon heat cooling rental requirement'],
  },
  7: {
    concerns: ['wildfire season', 'back-to-school moves', 'next year rent increase cap'],
    searches: ['Oregon rent increase cap announcement', 'Central Oregon wildfire homes'],
  },
  8: {
    concerns: ['Oregon rent increase cap for next year (published each September)', 'fall maintenance', 'heating season prep'],
    searches: ['Oregon maximum annual rent increase', 'Central Oregon fall home maintenance'],
  },
  9: {
    concerns: ['next year rent increase cap and renewals', 'irrigation blowouts and winterizing', 'heating and wood stove safety', 'housing market news'],
    searches: ['Oregon maximum rent increase {next}', 'Bend irrigation blowout winterize', 'Central Oregon housing market news'],
  },
  10: {
    concerns: ['winterizing and frozen pipes', 'snow removal', 'holiday-season vacancies', 'next year renewals'],
    searches: ['Bend winter storm homes pipes', 'Oregon rent increase cap {next} landlords'],
  },
  11: {
    concerns: ['winter storms and pipes', 'year-end owner taxes', 'new laws taking effect January 1'],
    searches: ['Oregon new laws January 1 landlords tenants', 'Central Oregon winter storm power outage homes'],
  },
}

/** This month's plan, with {year}/{next} in searches filled in. */
export function monthPlan(now = new Date()): MonthPlan {
  const plan = PLANS[now.getMonth()]
  const year = now.getFullYear()
  return {
    concerns: plan.concerns,
    searches: plan.searches.map((q) => q.replace('{year}', String(year)).replace('{next}', String(year + 1))),
  }
}
