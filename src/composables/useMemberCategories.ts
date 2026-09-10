import { computed } from 'vue'

/**
 * Resolve the site's member categories from `appConfig.markuxt.members.categories`
 * (defined in nuxt.config.ts).
 *
 * `key` is what authors put in a member's markdown frontmatter (`category:`);
 * `labelKey` is the i18n key translated into `name`. The array order is the
 * canonical display / filter / sort order. Everything is reactive to both the
 * config and the active locale, so a language switch re-translates the labels.
 *
 * There are NO built-in defaults — every consuming site declares its own
 * categories. With none configured, the Members page simply lists everyone
 * (no filter bar) and unknown category keys fall back to their raw label.
 */
export function useMemberCategories() {
  const appConfig = useAppConfig()
  const { t } = useI18n()

  const raw = computed(() => appConfig.markuxt?.members?.categories ?? [])

  const categories = computed(() =>
    raw.value.map((c) => ({
      key: c.key,
      labelKey: c.labelKey,
      groupByRole: c.groupByRole ?? false,
      name: t(c.labelKey),
    })),
  )

  const categoryKeys = computed(() => raw.value.map((c) => c.key))

  /** Translate a member's `category` key into its display label. */
  const categoryName = (key?: string): string =>
    categories.value.find((c) => c.key === key)?.name || key || t('members.teamMember')

  return { categories, categoryKeys, categoryName }
}

/**
 * Canonical member sort: by category rank (config array order; unknown
 * categories last), then by the numeric `order` frontmatter field (missing or
 * 0 = last), then by `_path`/`_id` as a deterministic SSR↔client tiebreaker.
 *
 * Shared by MembersGrid (grid display) and MembersListing (role grouping) so
 * both derive the exact same sequence — grouping MUST sort first, otherwise
 * role-section order silently follows the raw content-query order (≈ file
 * name order) instead of `order`.
 */
export function sortMembers<T extends {
  category?: string
  order?: number | string
  _path?: string
  _id?: string
}>(members: T[], categoryKeys: string[]): T[] {
  const rank = (cat: string | undefined) => {
    const i = categoryKeys.indexOf(cat || '')
    return i === -1 ? categoryKeys.length : i
  }
  return [...members].sort((a, b) => {
    const catRankA = rank(a.category)
    const catRankB = rank(b.category)
    if (catRankA !== catRankB) {
      return catRankA - catRankB
    }
    const byOrder = (Number(a.order) || 999) - (Number(b.order) || 999)
    if (byOrder !== 0) return byOrder
    return String(a._path || a._id || '').localeCompare(String(b._path || b._id || ''))
  })
}

