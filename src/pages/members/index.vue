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

// Redirect `/members` to the first configured category so the URL always
// reflects what is shown and each category has a shareable route.
// Done in a route MIDDLEWARE, not setup: middleware intercepts client-side
// navigation (navbar → /members) BEFORE this page mounts — a navigateTo in
// setup aborts the component mid-suspense on the client and leaves a blank
// page. On the server both forms prerender identically (302 → meta-refresh
// for static hosting).
definePageMeta({
  middleware: [
    () => {
      // Read appConfig directly — NOT useMemberCategories(): its useI18n()
      // needs a component instance, which route middleware doesn't have
      // (throws "must be called at the top of a setup function"). Only the
      // key is needed here, never the translated label.
      const appConfig = useAppConfig() as { markuxt?: { members?: { categories?: Array<{ key: string }> } } }
      const categories = appConfig?.markuxt?.members?.categories ?? []
      if (categories.length > 0) {
        return navigateTo(`/members/${categories[0].key}`, { redirectCode: 302 })
      }
    },
  ],
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
</style>
