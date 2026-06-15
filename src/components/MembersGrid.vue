<template>
  <section class="members-section" v-if="members.length > 0">
    <div v-for="(category, index) in categorizedMembers" :key="category.name" class="members-category">
      <h3 class="members-category__title" v-if="groupBy">{{ category.name }}</h3>
      <div class="members-grid">
        <MemberCard
          v-for="member in category.members"
          :key="member.slug"
          :member="member"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Member {
  name: string
  slug: string
  role?: string
  title?: string
  email?: string
  scholar?: string
  image?: string
  interests?: string[]
  category?: string
  order?: number
  _path?: string
  _id?: string
  [key: string]: any  // Preserve all Nuxt Content fields
}

interface Props {
  members: Member[]
  groupBy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  groupBy: true
})

const { t } = useI18n()
// Categories + ordering come from appConfig (nuxt.config.ts), with a fallback.
const { categoryKeys, categoryName } = useMemberCategories()

// Sort members by category order (unknown categories last), then by order field
const sortedMembers = computed(() => {
  const order = categoryKeys.value
  const rank = (cat: string | undefined) => {
    const i = order.indexOf(cat || '')
    return i === -1 ? order.length : i
  }
  return [...props.members].sort((a, b) => {
    const catRankA = rank(a.category)
    const catRankB = rank(b.category)
    if (catRankA !== catRankB) {
      return catRankA - catRankB
    }
    return (a.order || 999) - (b.order || 999)
  })
})

const categorizedMembers = computed(() => {
  if (!props.groupBy) {
    return [{
      name: t('members.section'),
      members: sortedMembers.value
    }]
  }

  const groups: Record<string, Member[]> = {}
  const fallbackCat = categoryKeys.value[0] || ''

  for (const member of sortedMembers.value) {
    // Known categories group under themselves; anything else falls back to the
    // first category so no member is silently dropped from a grouped view.
    const cat = member.category && categoryKeys.value.includes(member.category)
      ? member.category
      : fallbackCat
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(member)
  }

  // Return groups in configured order, skipping empty ones.
  return categoryKeys.value
    .filter(key => groups[key] && groups[key].length > 0)
    .map(key => ({
      name: categoryName(key),
      members: groups[key]
    }))
})
</script>

<style scoped>
.members-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3xl);
}

.members-category {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.members-category__title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border);
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-xl);
}

@media (max-width: 640px) {
  .members-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-lg);
  }
}
</style>
