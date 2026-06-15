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
    raw.value.map((c) => ({ key: c.key, labelKey: c.labelKey, name: t(c.labelKey) })),
  )

  const categoryKeys = computed(() => raw.value.map((c) => c.key))

  /** Translate a member's `category` key into its display label. */
  const categoryName = (key?: string): string =>
    categories.value.find((c) => c.key === key)?.name || key || t('members.teamMember')

  return { categories, categoryKeys, categoryName }
}

