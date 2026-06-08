#!/usr/bin/env -S node --loader tsx

/**
 * markuxt-sync-publications
 *
 * GitHub Action to sync publications from OpenAlex based on member ORCIDs.
 * Fetches publications for all members with ORCID, deduplicates against existing
 * content, and writes new markdown files to <content_dir>/publications/<year>/<openalex_id>/index.md
 *
 * Usage: Called via GitHub Action (see action.yml) or directly:
 *   ROR_ID="https://ror.org/..." CONTACT_EMAIL="..." CONTENT_DIR="src" tsx index.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

// Inputs from GitHub Actions (passed as environment variables)
const ROR_ID = process.env.INPUT_ROR_ID || ''
const CONTACT_EMAIL = process.env.INPUT_CONTACT_EMAIL || ''
const CONTENT_DIR = process.env.INPUT_CONTENT_DIR || 'src'
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT || ''

if (!ROR_ID) {
  console.error('Error: INPUT_ROR_ID is required')
  process.exit(1)
}

if (!CONTACT_EMAIL) {
  console.error('Error: INPUT_CONTACT_EMAIL is required')
  process.exit(1)
}

const OPENALEX_BASE = 'https://api.openalex.org'
const PUBLICATIONS_DIR = join(CONTENT_DIR, 'publications')
const MEMBERS_DIR = join(CONTENT_DIR, 'members')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExistingPublication {
  openalexId?: string
  doi?: string
  title?: string
  year?: number
  authors?: string[]
}

interface PendingPublication {
  openalexId: string
  title: string
  authors: string[]
  authorsOrcid: (string | null)[]
  year: number
  doi: string | null
  venue: string | null
  keywords: string[]
  abstract: string | null
  hidden: boolean
}

interface MemberInfo {
  name: string
  orcid: string
}

// ---------------------------------------------------------------------------
// YAML / Markdown helpers
// ---------------------------------------------------------------------------

function parseYamlFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const result: Record<string, unknown> = {}
  const lines = match[1].split('\n')
  let currentKey = ''
  let currentList: string[] | null = null
  for (const line of lines) {
    const listItem = line.match(/^  - (.+)$/)
    if (listItem && currentList !== null) {
      currentList.push(listItem[1].trim().replace(/^["']|["']$/g, ''))
      continue
    }
    if (currentList !== null) {
      result[currentKey] = currentList
      currentList = null
    }
    const kv = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/)
    if (!kv) continue
    const [, key, val] = kv
    const trimmed = val.trim()
    if (trimmed === '') {
      currentKey = key
      currentList = []
    } else {
      result[key] = trimmed.replace(/^["']|["']$/g, '')
    }
  }
  if (currentList !== null) result[currentKey] = currentList
  return result
}

function yamlStr(value: string): string {
  if (/[:#\[\]{}&*!,|>'"?%@`]/.test(value) || value.startsWith(' ') || value.endsWith(' ')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return value
}

// ---------------------------------------------------------------------------
// Deduplication helpers
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'a','an','the','of','in','on','for','to','and','or','with','by','from',
  'at','is','are','was','were','be','been','being','that','this','these',
  'those','it','its'
])

function tokenize(title: string): Set<string> {
  return new Set(
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let intersection = 0
  for (const w of a) if (b.has(w)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function authorOverlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '')
  const setA = new Set(a.map(normalize))
  const setB = new Set(b.map(normalize))
  let intersection = 0
  for (const n of setA) if (setB.has(n)) intersection++
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function isDuplicate(
  candidate: { title: string; year: number; authors: string[] },
  existing: { title: string; year: number; authors: string[] }
): boolean {
  if (candidate.title.toLowerCase().trim() === existing.title.toLowerCase().trim()) return true
  if (Math.abs(candidate.year - existing.year) > 1) return false
  const titleSim = jaccardSimilarity(tokenize(candidate.title), tokenize(existing.title))
  const authorSim = authorOverlap(candidate.authors, existing.authors)
  return titleSim >= 0.85 && authorSim >= 0.5
}

// ---------------------------------------------------------------------------
// Abstract reconstruction from inverted index
// ---------------------------------------------------------------------------

function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string | null {
  if (!invertedIndex) return null
  const entries: [string, number][] = []
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) entries.push([word, pos])
  }
  entries.sort((a, b) => a[1] - b[1])
  return entries.map(e => e[0]).join(' ')
}

// ---------------------------------------------------------------------------
// Author name formatting: OpenAlex display_name → "LastName, FirstName"
// ---------------------------------------------------------------------------

function formatAuthorName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return `${last}, ${first}`
}

function extractOrcidId(orcidUrl: string | null): string | null {
  if (!orcidUrl) return null
  const m = orcidUrl.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/)
  return m ? m[1] : null
}

// ---------------------------------------------------------------------------
// Markdown file builder
// ---------------------------------------------------------------------------

function buildMarkdown(pub: PendingPublication): string {
  const lines: string[] = ['---', `_hidden: ${pub.hidden}`]
  lines.push(`title: ${yamlStr(pub.title)}`)
  lines.push('authors:')
  for (const a of pub.authors) lines.push(`  - ${yamlStr(a)}`)
  lines.push('authors_orcid:')
  for (const o of pub.authorsOrcid) lines.push(`  - ${o ?? 'null'}`)
  lines.push(`year: ${pub.year}`)
  lines.push(`doi: ${pub.doi ? yamlStr(pub.doi) : ''}`)
  lines.push(`openalex_id: ${pub.openalexId}`)
  lines.push(`venue: ${pub.venue ? yamlStr(pub.venue) : ''}`)
  if (pub.keywords.length) {
    lines.push('keywords:')
    for (const k of pub.keywords) lines.push(`  - ${yamlStr(k)}`)
  } else {
    lines.push('keywords: []')
  }
  lines.push('---', '')
  if (pub.abstract) lines.push(pub.abstract, '')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// OpenAlex API helpers
// ---------------------------------------------------------------------------

async function oaFetch(path: string): Promise<unknown> {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${OPENALEX_BASE}${path}${sep}mailto=${encodeURIComponent(CONTACT_EMAIL)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': `markuxt-sync-publications/1.0 (mailto:${CONTACT_EMAIL})` }
  })
  if (!res.ok) throw new Error(`OpenAlex ${res.status}: ${url}`)
  return res.json()
}

async function getInstitutionId(rorId: string): Promise<string> {
  const data = await oaFetch(
    `/institutions?filter=ror:${encodeURIComponent(rorId)}&select=id`
  ) as { results: { id: string }[] }
  if (!data.results?.length) throw new Error(`Institution not found for ROR: ${rorId}`)
  return data.results[0].id
}

async function getAuthorId(orcid: string): Promise<string | null> {
  const data = await oaFetch(
    `/authors?filter=orcid:${encodeURIComponent(orcid)}&select=id`
  ) as { results: { id: string }[] }
  return data.results?.[0]?.id ?? null
}

async function getWorksForAuthor(authorId: string, institutionId: string): Promise<unknown[]> {
  const works: unknown[] = []
  let cursor = '*'
  const fields = 'id,title,authorships,publication_year,doi,primary_location,keywords,abstract_inverted_index'
  while (true) {
    const data = await oaFetch(
      `/works?filter=author.id:${encodeURIComponent(authorId)},institution.id:${encodeURIComponent(institutionId)}&per_page=200&cursor=${cursor}&select=${fields}`
    ) as { results: unknown[]; meta: { next_cursor: string | null } }
    works.push(...data.results)
    if (!data.meta?.next_cursor) break
    cursor = data.meta.next_cursor
  }
  return works
}

// ---------------------------------------------------------------------------
// Scan existing publications
// ---------------------------------------------------------------------------

async function scanExistingPublications(): Promise<ExistingPublication[]> {
  const files = await glob('**/*.md', { cwd: PUBLICATIONS_DIR, absolute: true })
  const existing: ExistingPublication[] = []
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const fm = parseYamlFrontmatter(content)
    if (fm._hidden === 'true' || fm._hidden === true) continue
    const openalexId = typeof fm.openalex_id === 'string'
      ? fm.openalex_id.replace(/^W/, '') : undefined
    const doi = typeof fm.doi === 'string' && fm.doi ? fm.doi : undefined
    const title = typeof fm.title === 'string' ? fm.title : undefined
    const year = typeof fm.year === 'string'
      ? parseInt(fm.year) : (typeof fm.year === 'number' ? fm.year : undefined)
    const authors = Array.isArray(fm.authors) ? fm.authors as string[] : undefined
    existing.push({ openalexId, doi, title, year, authors })
  }
  return existing
}

// ---------------------------------------------------------------------------
// Scan members with ORCID
// ---------------------------------------------------------------------------

async function scanMembersWithOrcid(): Promise<MemberInfo[]> {
  const files = await glob('**/*.md', { cwd: MEMBERS_DIR, absolute: true })
  const members: MemberInfo[] = []
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const fm = parseYamlFrontmatter(content)
    if (fm._hidden === 'true' || fm._hidden === true) continue
    if (typeof fm.orcid === 'string' && fm.orcid.trim()) {
      members.push({ name: String(fm.name ?? 'Unknown'), orcid: fm.orcid.trim() })
    }
  }
  return members
}

// ---------------------------------------------------------------------------
// Parse OpenAlex work → PendingPublication
// ---------------------------------------------------------------------------

function parseWork(work: Record<string, unknown>): PendingPublication | null {
  const rawId = typeof work.id === 'string'
    ? work.id.replace('https://openalex.org/', '') : null
  if (!rawId) return null

  const title = typeof work.title === 'string' ? work.title.trim() : null
  if (!title) return null

  const year = typeof work.publication_year === 'number' ? work.publication_year : null
  if (!year) return null

  const authorships = Array.isArray(work.authorships)
    ? work.authorships as Record<string, unknown>[] : []

  const authors = authorships.map(a => {
    const author = a.author as Record<string, unknown> | undefined
    return author?.display_name ? formatAuthorName(String(author.display_name)) : null
  }).filter((n): n is string => n !== null)

  const authorsOrcid = authorships.map(a => {
    const author = a.author as Record<string, unknown> | undefined
    return extractOrcidId(author?.orcid ? String(author.orcid) : null)
  })

  const doiRaw = typeof work.doi === 'string' ? work.doi : null
  const doi = doiRaw
    ? (doiRaw.startsWith('http') ? doiRaw : `https://doi.org/${doiRaw}`) : null

  const primaryLocation = work.primary_location as Record<string, unknown> | undefined
  const source = primaryLocation?.source as Record<string, unknown> | undefined
  const venue = source?.display_name ? String(source.display_name) : null

  const keywordsRaw = Array.isArray(work.keywords)
    ? work.keywords as Record<string, unknown>[] : []
  const keywords = keywordsRaw.map(k => String(k.display_name ?? '')).filter(Boolean)

  const abstract = reconstructAbstract(
    work.abstract_inverted_index as Record<string, number[]> | null
  )

  return { openalexId: rawId, title, authors, authorsOrcid, year, doi, venue, keywords, abstract, hidden: false }
}

// ---------------------------------------------------------------------------
// Set GitHub Actions output
// ---------------------------------------------------------------------------

function setOutput(name: string, value: string): void {
  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, `${name}=${value}\n`)
  }
  console.log(`::set-output name=${name}::${value}`)
}

function appendFileSync(file: string, data: string): void {
  const fd = require('fs').openSync(file, 'a')
  require('fs').writeSync(fd, data)
  require('fs').closeSync(fd)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[markuxt-sync-publications] Starting...`)
  console.log(`[markuxt-sync-publications] ROR ID: ${ROR_ID}`)
  console.log(`[markuxt-sync-publications] Content dir: ${CONTENT_DIR}`)

  // 1. Resolve institution OpenAlex ID
  const institutionId = await getInstitutionId(ROR_ID)
  console.log(`[markuxt-sync-publications] Institution ID: ${institutionId}`)

  // 2. Scan existing publications
  const existing = await scanExistingPublications()
  const existingOpenalexIds = new Set(
    existing.map(p => p.openalexId).filter((id): id is string => !!id)
  )
  const existingDois = new Set(
    existing
      .map(p => p.doi?.toLowerCase().replace(/https?:\/\/doi\.org\//i, ''))
      .filter((d): d is string => !!d)
  )
  console.log(`[markuxt-sync-publications] Found ${existing.length} existing publications`)

  // 3. Scan members with ORCID
  const members = await scanMembersWithOrcid()
  console.log(`[markuxt-sync-publications] Found ${members.length} members with ORCID`)

  // 4. Fetch works from OpenAlex for each member
  const allWorks = new Map<string, PendingPublication>()
  for (const member of members) {
    console.log(`[markuxt-sync-publications] Processing ${member.name} (${member.orcid})...`)
    const authorId = await getAuthorId(member.orcid)
    if (!authorId) {
      console.warn(`  → Not found on OpenAlex: ${member.orcid}`)
      continue
    }
    console.log(`  → Author ID: ${authorId}`)
    const works = await getWorksForAuthor(authorId, institutionId)
    console.log(`  → ${works.length} works`)
    for (const w of works) {
      const pub = parseWork(w as Record<string, unknown>)
      if (!pub) continue
      if (!allWorks.has(pub.openalexId)) allWorks.set(pub.openalexId, pub)
    }
  }
  console.log(`[markuxt-sync-publications] Total unique works from OpenAlex: ${allWorks.size}`)

  // 5. Filter out already-existing works
  const pending: PendingPublication[] = []
  for (const pub of allWorks.values()) {
    const shortId = pub.openalexId.replace(/^W/, '')
    if (existingOpenalexIds.has(shortId)) continue
    const doiKey = pub.doi?.toLowerCase().replace(/https?:\/\/doi\.org\//i, '')
    if (doiKey && existingDois.has(doiKey)) continue
    const dupOfExisting = existing.some(e =>
      e.title && e.year != null &&
      isDuplicate(
        { title: pub.title, year: pub.year, authors: pub.authors },
        { title: e.title, year: e.year, authors: e.authors ?? [] }
      )
    )
    if (dupOfExisting) continue
    pending.push(pub)
  }
  console.log(`[markuxt-sync-publications] After dedup vs existing: ${pending.length} to add`)

  // 6. Dedup within pending list, keep newest per group
  const toWrite: PendingPublication[] = []
  const consumed = new Set<number>()
  for (let i = 0; i < pending.length; i++) {
    if (consumed.has(i)) continue
    const group: number[] = [i]
    for (let j = i + 1; j < pending.length; j++) {
      if (consumed.has(j)) continue
      const a = pending[i], b = pending[j]
      const sameDoi = !!(a.doi && b.doi && a.doi.toLowerCase() === b.doi.toLowerCase())
      const sameTitle = a.title.toLowerCase().trim() === b.title.toLowerCase().trim()
      const similar = isDuplicate(
        { title: a.title, year: a.year, authors: a.authors },
        { title: b.title, year: b.year, authors: b.authors }
      )
      if (sameDoi || sameTitle || similar) {
        group.push(j)
        consumed.add(j)
      }
    }
    consumed.add(i)
    // Sort group: newest first; hide all but the first
    group.sort((x, y) => pending[y].year - pending[x].year)
    for (let k = 0; k < group.length; k++) {
      toWrite.push({ ...pending[group[k]], hidden: k > 0 })
    }
  }

  const visible = toWrite.filter(p => !p.hidden).length
  const hidden = toWrite.filter(p => p.hidden).length
  console.log(`[markuxt-sync-publications] Writing ${toWrite.length} files (${visible} visible, ${hidden} hidden)`)

  // 7. Write markdown files
  const newFiles: string[] = []
  for (const pub of toWrite) {
    const dir = join(PUBLICATIONS_DIR, String(pub.year), pub.openalexId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const filePath = join(dir, 'index.md')
    writeFileSync(filePath, buildMarkdown(pub), 'utf-8')
    console.log(`  [${pub.hidden ? 'hidden' : 'visible'}] ${filePath}`)
    newFiles.push(filePath)
  }

  // 8. Set GitHub Actions outputs
  setOutput('count', String(newFiles.length))
  setOutput('files', newFiles.join('\n'))

  console.log(`[markuxt-sync-publications] Done. Added ${newFiles.length} publication files.`)
}

main().catch(err => {
  console.error('[markuxt-sync-publications] Fatal:', err)
  process.exit(1)
})
