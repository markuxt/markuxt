/**
 * Fetch a single content document by its `_path`, locale-aware.
 *
 * HYBRID approach:
 * 1. Path-based findOne (payload-cached, no 404) — returns ONE variant. If
 *    its locale matches the target (exact or language-prefix), done.
 * 2. If locale mismatches, fetch the SECTION LISTING query (e.g.
 *    `queryContent('/members').find()`) — which IS prerendered + payload-cached
 *    (same pattern as listing pages, no hash mismatch). Filter by `_path` to
 *    get all variants, then `pickLocaleVariant` selects the best.
 *
 * Why not query the detail path directly? A filtered `where({_path}).find()`
 * produces a different query hash on client vs server under `no_prefix` + static
 * → 404 on refresh. The SECTION listing query doesn't have this problem (it's
 * the same query shape as listing pages, which are prerendered reliably).
 *
 * Both queries are built SYNCHRONOUSLY (before any await) to avoid losing the
 * Nuxt instance context in the async handler.
 */
export async function findOneContentDoc<T = any>(
  fullPath: string,
  locale: string = 'en',
  defaultLocale: string = 'en',
): Promise<T | null> {
  // Normalise: strip trailing slashes so fullPath matches content _path
  fullPath = fullPath.replace(/\/+$/, '') || '/'
  // Derive the content section from the path: /members/staff/foo → /members
  const section = fullPath.split('/').slice(0, 2).join('/') || '/'

  // Build BOTH queries synchronously (before any await — Nuxt context is only
  // available synchronously in the async handler).
  const findOnePromise = queryContent(fullPath).findOne().catch(() => null)
  const listingPromise = queryContent(section)
    .where({ _hidden: { $ne: true } })
    .where({ _extension: 'md' })
    .find()
    .catch(() => [])

  // 1. Try findOne first (fast, payload-cached)
  const doc: any = await findOnePromise
  if (doc && doc._type !== 'binary') {
    const rank = localeRank(doc.locale, locale, defaultLocale)
    if (rank >= 2) {
      // Exact (3) or language-prefix (2) match — good enough, no need to
      // fetch the full listing.
      if (doc._path && doc._path !== fullPath) doc._path = fullPath
      return doc as T
    }
  }

  // 2. Locale mismatch (or no doc) — fetch the section listing + pick.
  //    The listing query is prerendered (same as listing pages) → no 404.
  const allDocs: any[] = await listingPromise
  const variants = allDocs.filter((d: any) => d._path === fullPath)
  if (variants.length === 0) return (doc && doc._type !== 'binary' ? doc : null) as T
  if (variants.length === 1) return variants[0] as T

  const best = pickLocaleVariant(variants, locale, defaultLocale)
  if (best && (best as any)._path && (best as any)._path !== fullPath) {
    ;(best as any)._path = fullPath
  }
  return (best as T) ?? null
}
