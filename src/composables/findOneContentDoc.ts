/**
 * Fetch a single content document by its `_path`, locale-aware — MERGING all
 * locale variants of the document so partial variant files inherit fields from
 * the default/current locale per the priority chain (see `useContentLocale`).
 *
 * Approach: fetch the SECTION listing query (e.g. `queryContent('/members')`)
 * — which IS prerendered + payload-cached (same shape as listing pages, no hash
 * mismatch / 404 on refresh) — filter to this `_path`'s variants, then merge.
 * A filtered `where({_path}).findOne()` is avoided because it breaks payload
 * caching under `no_prefix` + static hosting.
 *
 * The listing query + the locale-order lookup are built SYNCHRONOUSLY (before
 * any await) to avoid losing the Nuxt instance context in the async handler.
 */
export async function findOneContentDoc<T = any>(
  fullPath: string,
  locale: string = 'en',
  defaultLocale: string = 'en',
): Promise<T | null> {
  // Normalise: strip trailing slashes so fullPath matches content _path.
  fullPath = fullPath.replace(/\/+$/, '') || '/'
  // Derive the content section from the path: /members/staff/foo → /members
  const section = fullPath.split('/').slice(0, 2).join('/') || '/'

  // Locale order (i18n definition order) for the merge tier-3 tiebreak.
  // Read synchronously — Nuxt context is only available before the first await.
  let localeOrder: string[] = []
  try {
    const i18n = useNuxtApp().$i18n as any
    localeOrder = (i18n?.locales?.value || []).map((l: any) => l?.code).filter(Boolean)
  } catch { /* context unavailable */ }

  // Build the listing query synchronously (before await).
  const listingPromise = queryContent(section)
    .where({ _hidden: { $ne: true } })
    .where({ _extension: 'md' })
    .find()
    .catch(() => [])

  const allDocs: any[] = await listingPromise
  const variants = allDocs.filter((d: any) => d._path === fullPath)

  if (variants.length >= 1) {
    const merged = mergeLocaleVariants(variants, locale, defaultLocale, localeOrder)
    if (merged) {
      ;(merged as any)._path = fullPath
      return merged as T
    }
  }

  // No markdown variants — fall back to a path findOne (binary asset, etc.).
  const one: any = await queryContent(fullPath).findOne().catch(() => null)
  if (one && one._type !== 'binary') {
    if (one._path && one._path !== fullPath) one._path = fullPath
    return one as T
  }
  return null
}
