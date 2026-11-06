import type { PGlite } from '@electric-sql/pglite'

/**
 * Splits a pasteable SQL file into statements the way Postgres sees them:
 * semicolons inside quotes, dollar-quoted bodies (DO blocks) and comments
 * don't end a statement. Comment-only chunks are dropped.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let i = 0
  while (i < sql.length) {
    const rest = sql.slice(i)
    if (rest.startsWith('--')) {
      const end = sql.indexOf('\n', i)
      i = end === -1 ? sql.length : end + 1
      current += '\n'
      continue
    }
    const dollar = rest.match(/^\$[A-Za-z_]*\$/)
    if (dollar) {
      const close = sql.indexOf(dollar[0], i + dollar[0].length)
      if (close === -1) throw new Error(`Unclosed ${dollar[0]} quote`)
      current += sql.slice(i, close + dollar[0].length)
      i = close + dollar[0].length
      continue
    }
    const ch = sql[i]
    if (ch === "'" || ch === '"') {
      let j = i + 1
      while (j < sql.length) {
        if (sql[j] === ch && sql[j + 1] === ch) j += 2
        else if (sql[j] === ch) break
        else j++
      }
      current += sql.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (ch === ';') {
      if (current.trim()) statements.push(current.trim())
      current = ''
      i++
      continue
    }
    current += ch
    i++
  }
  if (current.trim()) statements.push(current.trim())
  return statements
}

/**
 * Runs a file the two ways an editor might: as one script on one session, or
 * statement by statement where every statement starts on a fresh session (no
 * open transaction, temp tables or SET LOCAL carried over), stopping at the
 * first error. A file that only works one way fails here.
 */
export async function runAsEditor(db: PGlite, sql: string, mode: 'script' | 'per-statement') {
  if (mode === 'script') return db.exec(sql)
  const results = []
  for (const statement of splitStatements(sql)) {
    await db.exec('ROLLBACK').catch(() => undefined)
    await db.exec('DISCARD ALL')
    results.push(...(await db.exec(statement)))
  }
  await db.exec('ROLLBACK').catch(() => undefined)
  return results
}
