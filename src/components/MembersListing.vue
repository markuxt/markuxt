<template>
  <div class="members-listing">
    <!-- Category filter — each entry links to its own route so visitors can
         land directly on a category (/members/<key>, /members/all). -->
    <div class="members-filter" v-if="memberCategories.length > 1">
      <NuxtLink
        v-for="category in filterCategories"
        :key="category.key"
        :to="`/members/${category.key}`"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeCategory === category.key }"
      >
        {{ category.name }}
      </NuxtLink>
    </div>

    <!-- Role sub-sections (category opted in via `groupByRole: true`) -->
    <template v-if="roleGroups.length > 0">
      <section
        v-for="group in roleGroups"
        :key="group.role"
        class="members-role"
      >
        <h3 v-if="group.role" class="members-role__title">{{ group.role }}</h3>
        <MembersGrid :members="group.members" :groupBy="false" />
      </section>
    </template>

    <!-- Flat grid -->
    <MembersGrid
      v-else-if="filteredMembers.length > 0"
      :members="filteredMembers"
      :groupBy="false"
    />
    <p v-else class="no-results">{{ t('members.noResults') }}</p>
  </div>
</template>

<script setup lang="ts">
interface Member {
  name: string
  role?: string
  title?: string
  email?: string
  scholar?: string
  image?: string
  interests?: string[]
  category?: string
  order?: number
  _path?: string
  slug: string
}

const props = defineProps<{
  /** Active category key — a configured category key, or 'all'. */
  activeCategory: string
}>()

const { t } = useI18n()

// Fetch all members
const _locale = useActiveLocale()
const _defaultLocale = useDefaultLocale()
const _localeOrder = useLocaleOrder()
const { data: allMembers } = await useAsyncData(`members-${_locale.value}`, async () => {
  const docs = await queryContent('/members')
    .where({ _hidden: { $ne: true } })
    .where({ _extension: 'md' }).find()
  return mergeByPath(docs, _locale.value, _defaultLocale.value, _localeOrder.value)
}, { watch: [_locale] })

const processedMembers = computed(() => {
  const members = (allMembers.value || []).map(member => {
    const processed = {
      ...member,
      name: member.name || member.title || t('members.unknown'),
      category: member.category ?? undefined, // Ensure 'category' exists
      slug: member._id || member._path || '' // Ensure 'slug' exists
    }
    return processed
  })
  return members
})

// Categories come from `appConfig.markuxt.members.categories` (nuxt.config.ts),
// with a built-in fallback. The "all" pseudo-category is appended for the
// filter only.
const { categories: memberCategories } = useMemberCategories()

const filterCategories = computed(() => [
  ...memberCategories.value,
  { key: 'all', name: t('members.allMembers') }
])

const filteredMembers = computed(() => {
  if (props.activeCategory === 'all') {
    return processedMembers.value
  }
  return processedMembers.value.filter(m => m.category === props.activeCategory)
})

// When the active category opts in via `groupByRole: true`, split its members
// into sub-sections by `role` frontmatter. Section order follows the first
// appearance of each role in the sorted member order; members without a role
// collect in a final, unheaded section.
const roleGroups = computed(() => {
  const config = memberCategories.value.find(c => c.key === props.activeCategory)
  if (!config?.groupByRole || props.activeCategory === 'all') return []
  const groups: { role: string; members: Member[] }[] = []
  for (const member of filteredMembers.value) {
    const role = (member.role || '').trim()
    let group = groups.find(g => g.role === role)
    if (!group) {
      group = { role, members: [] }
      groups.push(group)
    }
    group.members.push(member as Member)
  }
  return groups
})
</script>

<style scoped>
.members-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-2xl);
}

.filter-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  display: inline-block;
}

.filter-btn:hover {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.filter-btn--active {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-on-secondary);
}

.filter-btn--active:hover {
  background: var(--surface-brand);
  border-color: var(--surface-brand);
  color: var(--color-on-brand);
}

.members-role {
  margin-bottom: var(--spacing-xl);
}

.members-role__title {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.no-results {
  text-align: center;
  padding: var(--spacing-3xl);
  font-size: 1.125rem;
  color: var(--color-text-muted);
}
</style>
