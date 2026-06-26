/**
 * Locale-aware content variant MERGING (field-level).
 *
 * Used by listing pages (`mergeByPath`) and detail pages (`findOneContentDoc`).
 *
 * Locale variants share one route — their `_path` is collapsed by
 * `content-locale.ts` so e.g. `name.md` and `name.zh-CN.md` both map to
 * `/.../name`. A variant file may be PARTIAL: it only declares the frontmatter
 * fields (and body) that change for that language, and inherits everything else.
 *
 * This module merges all variants of one document into a single doc, resolving
 * EVERY field (and the body) through a priority chain:
 *
 *   tier 1 — current locale (exact match)   the active rendering language
 *   tier 2 — default locale                  the fully-defined base doc
 *   tier 3 — remaining variants              ONLY when no default-locale variant
 *            (i18n order, then alphabetical)  exists in the group
 *
 * "If a default exists, only the default is used as fallback" — when a
 * default-locale variant is present, tier 3 is skipped, so a missing field
 * falls back to the default rather than leaking from another language (e.g. a
 * Chinese body never appears on the English page). Tier 3 only engages when the
 * group has no default-locale variant at all.
 *
 * The body and `_id` are taken from the highest-priority variant that HAS a
 * body (the "body provider"). Because locale variants are sibling files in the
 * same directory, relative asset paths (`assets/38.png`) resolve identically
 * regardless of which variant supplies `_id`.
 */

import { computed } from 'vue'

const LOCALE_SUFFIX_RE = /\.[a-z]{2}(?:-[a-z0-9]{2,3})?$/i

/** Strip a locale suffix from a _path: /.../hnrobert.zh → /.../hnrobert */
export function stripLocaleSuffix(p: string): string {
  return (p || '').replace(LOCALE_SUFFIX_RE, '')
}

/** Active locale from the GLOBAL i18n instance, as a REACTIVE computed.
 *  Under `no_prefix` the local `useI18n()` composer lags client-side locale
 *  switches; the global `$i18n` (same source `LanguageSwitcher.vue` uses)
 *  tracks them reliably. Returns a computed so listing pages can watch it and
 *  re-merge when the locale changes. */
export function useActiveLocale() {
  const i18n = useNuxtApp().$i18n as any
  return computed(() => i18n?.locale?.value || 'en')
}

/** Default locale from runtime config (set by the layer nuxt.config). */
export function useDefaultLocale(): string {
  try {
    return (useRuntimeConfig().public as any)?.i18n?.defaultLocale || 'en'
  } catch {
    return 'en'
  }
}

/** Locale codes in i18n DEFINITION order, as a reactive computed (drives the
 *  tier-3 tiebreak). Falls back to [defaultLocale]. */
export function useLocaleOrder() {
  const i18n = useNuxtApp().$i18n as any
  return computed<string[]>(() => {
    const codes = (i18n?.locales?.value || []).map((l: any) => l?.code).filter(Boolean)
    return codes.length ? codes : [useDefaultLocale()]
  })
}

/** Build the priority-ordered variant list for the target locale (highest
 *  first). See module header for the tier rules. */
function priorityOrder<T extends { locale?: string }>(
  variants: T[],
  target: string,
  defaultLocale: string,
  localeOrder: string[],
): T[] {
  const hasDefault = variants.some(v => v.locale === defaultLocale)
  const ordered: T[] = []

  const exact = variants.find(v => v.locale === target)
  if (exact) ordered.push(exact)

  if (target !== defaultLocale) {
    const def = variants.find(v => v.locale === defaultLocale)
    if (def) ordered.push(def)
  }

  // Tier 3 only when there is no default-locale variant in the group.
  if (!hasDefault) {
    const rest = variants
      .filter(v => v.locale !== target)
      .sort((a, b) => {
        const ia = localeOrder.indexOf(a.locale || '')
        const ib = localeOrder.indexOf(b.locale || '')
        const ra = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
        const rb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
        if (ra !== rb) return ra - rb
        return (a.locale || '').localeCompare(b.locale || '')
      })
    ordered.push(...rest)
  }

  return ordered
}

// Keys owned by Nuxt Content / our bookkeeping — never merged across variants.
const META_KEYS = new Set([
  '_id', '_path', '_type', '_file', '_extension', '_dir',
  '_draft', '_partial', '_hidden', '_source', 'position',
  'draft', 'partial', 'navigation', 'toc', 'body', 'locale',
  'description', 'excerpt',
])

/** True if `doc` declares `key` as a user field with a usable value. */
function isDefinedField(doc: any, key: string): boolean {
  if (META_KEYS.has(key)) return false
  if (!(key in doc)) return false
  const v = doc[key]
  return v !== undefined && v !== null
}

/** MERGE all locale variants of ONE document into a single doc, resolving each
 *  field (and the body) through the priority chain. */
export function mergeLocaleVariants<T extends Record<string, any> & { locale?: string }>(
  variants: T[],
  target: string,
  defaultLocale: string,
  localeOrder: string[] = [],
): T | null {
  if (!variants || variants.length === 0) return null

  if (variants.length === 1) {
    const single = { ...variants[0], _path: stripLocaleSuffix(variants[0]._path || '') } as T
    return single
  }

  const order = priorityOrder(variants, target, defaultLocale, localeOrder)

  // Body provider = highest-priority variant with a non-empty body.
  const bodyProvider = order.find(v => (v as any).body?.children?.length) || order[0]

  // Start from the body provider (correct _id for ContentRenderer + relative
  // asset resolution, plus the body AST), then overlay user fields from LOWEST
  // → HIGHEST priority so the highest-priority definition wins.
  const merged: any = { ...bodyProvider }
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i]
    for (const key in v) {
      if (!isDefinedField(v, key)) continue
      merged[key] = v[key]
    }
  }
  // Body + _id always belong to the body provider; _path is the collapsed base.
  merged.body = bodyProvider.body
  merged._id = bodyProvider._id
  merged._path = stripLocaleSuffix(bodyProvider._path || '')
  merged.locale = target
  return merged as T
}

/** Listing-page dedup: group docs by base _path, MERGE each group per the
 *  active locale, normalise _path to the base, preserve first-occurrence order. */
export function mergeByPath<T extends { _path?: string; locale?: string }>(
  docs: T[],
  target: string,
  defaultLocale: string,
  localeOrder: string[] = [],
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
    const merged = mergeLocaleVariants(byBase.get(base)!, target, defaultLocale, localeOrder)
    if (merged) {
      ;(merged as any)._path = base
      out.push(merged)
    }
  }
  return out
}
