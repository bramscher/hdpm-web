// Company facts used in copy site-wide. Craig confirmed the founding year is
// 1999 (updated 2026-08-19, superseding the earlier "since 2011" framing).
// "since 2003" and "since 2011" are both wrong now and must not reappear.
export const FOUNDED_YEAR = 1999
export const SERVING_SINCE = `Serving Central Oregon Since ${FOUNDED_YEAR}`

/**
 * Whole years in business, derived from the founding year so it stays correct
 * without edits (27 in 2026, 28 in 2027, …). Use this instead of hardcoding a
 * "N years" figure anywhere in copy.
 */
export const YEARS_IN_BUSINESS = new Date().getFullYear() - FOUNDED_YEAR
