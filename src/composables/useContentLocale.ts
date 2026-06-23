/**
 * Locale-aware content variant selection.
 *
 * Used by `findOneContentDoc` (detail pages) and the listing pages to pick the
 * best locale variant of a document from all variants sharing a `_path`
 * (made to collide by `content-locale.ts`).
 *
 * Fallback chain — only an EXACT match shows that language; otherwise fall
 * back to the language prefix, then the default locale:
 *   rank 3 = exact (incl. region)   e.g. doc `zh-CN` for target `zh-CN`
 *   rank 2 = same language prefix    e.g. doc `zh` for target `zh-TW` / `zh-CN`
 *   rank 1 = default locale          e.g. doc `en` (default) for any target
 *   rank 0 = no affinity
 */

/** Active locale from the GLOBAL i18n instance.
 *  Under `no_prefix` the local `useI18n()` composer lags client-side locale
 *  switches; the global `$i18n` (same source `LanguageSwitcher.vue` uses)
 *  tracks them reliably. */
export function useActiveLocale(): string {
  const i18n = useNuxtApp().$i18n as any
  return i18n?.locale?.value || 'en'
}

/** Default locale from runtime config (set by the layer nuxt.config). */
export function useDefaultLocale(): string {
  try {
    return (useRuntimeConfig().public as any)?.i18n?.defaultLocale || 'en'
  } catch {
    return 'en'
  }
}

/** Rank how well `docLocale` matches `target` (higher is better). */
export function localeRank(docLocale: string | undefined, target: string, defaultLocale: string): number {
  if (!docLocale) return 0
  if (docLocale === target) return 3
  const docLang = docLocale.split('-')[0]
  const targetLang = target.split('-')[0]
  if (docLang && docLang === targetLang) return 2
  if (docLocale === defaultLocale) return 1
  return 0
}

/** Pick the best-locale variant from docs sharing a `_path` (detail pages). */
export function pickLocaleVariant<T extends { locale?: string }>(
  docs: T[],
  target: string,
  defaultLocale: string,
): T | null {
  if (!docs || docs.length === 0) return null
  return docs.reduce((best: T | null, d) => {
    if (!best) return d
    return localeRank(d.locale, target, defaultLocale) >= localeRank(best.locale, target, defaultLocale)
      ? d
      : best
  }, null)
}

/** Strip a locale suffix from a _path: `/.../hnrobert.zh` → `/.../hnrobert` */
function stripLocaleSuffix(path: string): string {
  return path.replace(/\.[a-z]{2}(?:-[a-z0-9]{2,3})?$/i, '')
}

/** Group docs by their BASE _path (locale suffix stripped), pick the best
 *  variant per group, normalise _path to the base (for links), preserve
 *  first-occurrence order (listing pages). */
export function dedupeByPath<T extends { _path?: string; locale?: string }>(
  docs: T[],
  target: string,
  defaultLocale: string,
): T[] {
  const byBase = new Map<string, T[]>()
  const order: string[] = []
  for (const d of docs) {
    const base = stripLocaleSuffix(d._path ?? '')
    if (!byBase.has(base)) {
      byBase.set(base, [])
      order.push(base)
    }
    byBase.get(base)!.push(d)
  }
  const out: T[] = []
  for (const base of order) {
    const best = pickLocaleVariant(byBase.get(base)!, target, defaultLocale)
    if (best) {
      ;(best as any)._path = base  // normalise so links use the canonical route
      out.push(best)
    }
  }
  return out
}
