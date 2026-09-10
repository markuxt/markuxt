<template>
  <div class="members-page">
    <div class="section">
      <div class="container">
        <SectionTitle
          :overline="t('home.ourTeam')"
          :title="t('members.section')"
          :description="t('home.teamDescription')"
        />
        <MembersListing :active-category="activeCategory" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { categories } = useMemberCategories()

const activeCategory = computed(() => String(route.params.category || 'all'))

// Accept configured category keys plus the 'all' pseudo-category; anything
// else is a 404 (also during prerender of stale links).
const isValid = computed(
  () => activeCategory.value === 'all' || categories.value.some(c => c.key === activeCategory.value)
)
if (!isValid.value) {
  throw createError({ statusCode: 404, statusMessage: 'Member category not found', fatal: true })
}

// Head reflects the active category, reactively to locale switches.
const activeName = computed(() => {
  const config = categories.value.find(c => c.key === activeCategory.value)
  return config?.name || t('members.allMembers')
})

useHead({
  title: () => `${activeName.value} | ${t('members.pageTitle')}`,
  meta: [
    { name: 'description', content: t('members.pageDescription') }
  ]
})
</script>

<style scoped>
.members-page {
  padding-top: var(--spacing-xl);
}
</style>
