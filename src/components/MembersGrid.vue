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

// Category display names
const categoryNames = computed(() => ({
  staff: t('members.staff'),
  'research-students': t('members.researchStudents'),
  'research-assistants': t('members.researchAssistants'),
  alumni: t('members.alumni')
}))

// Category sort order
const categoryOrder = ['staff', 'research-students', 'research-assistants', 'alumni']

// Sort members by category order, then by order field
const sortedMembers = computed(() => {
  return [...props.members].sort((a, b) => {
    const catOrderA = categoryOrder.indexOf(a.category || '')
    const catOrderB = categoryOrder.indexOf(b.category || '')
    if (catOrderA !== catOrderB) {
      return catOrderA - catOrderB
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

  const categories: Record<string, Member[]> = {}

  for (const member of sortedMembers.value) {
    const cat = member.category || 'staff'
    if (!categories[cat]) {
      categories[cat] = []
    }
    categories[cat].push(member)
  }

  // Return categories in predefined order
  return categoryOrder
    .filter(key => categories[key] && categories[key].length > 0)
    .map(key => ({
      name: categoryNames.value[key] || key,
      members: categories[key]
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
