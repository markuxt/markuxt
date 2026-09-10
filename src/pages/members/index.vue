<template>
  <div class="members-page">
    <div class="section">
      <div class="container">
        <SectionTitle
          :overline="t('home.ourTeam')"
          :title="t('members.section')"
          :description="t('home.teamDescription')"
        />
        <!-- Zero-category sites keep a plain listing of everyone here. -->
        <MembersListing active-category="all" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

// With categories configured, `/members` redirects to the first one so the
// URL always reflects what is shown and each category has a shareable route
// (`/members/<key>`). On the server this renders as a 302 (prerendered as a
// meta-refresh page for static hosting); on the client it pushes the route.
const { categories } = useMemberCategories()
if (categories.value.length > 0) {
  await navigateTo(`/members/${categories.value[0].key}`, { redirectCode: 302 })
}

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
</style>
