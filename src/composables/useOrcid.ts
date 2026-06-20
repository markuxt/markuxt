/**
 * ORCID normalization helper for cross-linking members ↔ publications.
 *
 * Member files expose a single `orcid:` scalar; publication files expose a
 * parallel `authors_orcid:` array (one entry per author, `null` where an
 * author has none). Both *should* store bare IDs (`0000-0001-2345-6789`),
 * but consumers sometimes paste full `https://orcid.org/...` URLs.
 * `normalizeOrcid` makes the cross-link robust to that on both sides and is
 * used by both `members/[...slug].vue` (member → their publications) and
 * `publications/[...slug].vue` (publication → its member-authors).
 */

/**
 * Normalize an ORCID to its bare, uppercase, hyphenated form
 * (`0000-0001-2345-6789`). Accepts full `https://orcid.org/…` URLs,
 * `orcid.org/…` short form, bare IDs, and surrounding whitespace; tolerates
 * a trailing slash or path. Returns `''` for empty / non-string / `null`
 * input so a missing ORCID can never match a real one.
 */
export function normalizeOrcid(value: unknown): string {
  if (typeof value !== 'string') return ''
  let s = value.trim()
  if (!s) return ''
  // Strip an optional scheme + host (https://orcid.org/… or orcid.org/…).
  s = s.replace(/^https?:\/\/orcid\.org\//i, '').replace(/^orcid\.org\//i, '')
  // Keep only the characters that form an ORCID — digits, the checksum 'X',
  // and hyphens — and uppercase so an 'x' checksum lines up with 'X'.
  return s.replace(/[^0-9Xx-]/g, '').toUpperCase()
}
