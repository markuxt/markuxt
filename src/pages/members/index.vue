<template>
  <div class="members-page">
    <div class="section">
      <div class="container">
        <SectionTitle
          :overline="t('home.ourTeam')"
          :title="t('members.section')"
          :description="t('home.teamDescription')"
        />

        <!-- Category Filter -->
        <div class="members-filter" v-if="memberCategories.length > 1">
          <button
            v-for="category in filterCategories"
            :key="category.key"
            class="filter-btn"
            :class="{ 'filter-btn--active': activeCategory === category.key }"
            @click="activeCategory = category.key"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- Members Grid -->
        <MembersGrid
          v-if="filteredMembers.length > 0"
          :members="filteredMembers"
          :groupBy="false"
        />
        <p v-else class="no-results">{{ t('members.noResults') }}</p>
      </div>
    </div>
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

const { t } = useI18n()

// Fetch all members
const _locale = useActiveLocale()
const _defaultLocale = useDefaultLocale()
const { data: allMembers } = await useAsyncData(`members-${_locale}`, async () => {
  const docs = await queryContent('/members')
    .where({ _hidden: { $ne: true } })
    .where({ _extension: 'md' }).find()
  return dedupeByPath(docs, _locale, _defaultLocale)
}, { watch: [() => useActiveLocale()] })

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

const activeCategory = ref(memberCategories.value[0]?.key ?? 'all')

const filteredMembers = computed(() => {
  if (activeCategory.value === 'all') {
    return processedMembers.value
  }
  return processedMembers.value.filter(m => m.category === activeCategory.value)
})

useHead({
  title: t('members.pageTitle'),
  meta: [
    { name: 'description', content: t('members.pageDescription') }
  ]
})
</script>

<style scoped>
.members-page {
  padding-top: var(--spacing-xl);
}

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

.no-results {
  text-align: center;
  padding: var(--spacing-3xl);
  font-size: 1.125rem;
  color: var(--color-text-muted);
}
</style>
