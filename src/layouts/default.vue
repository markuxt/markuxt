<template>
  <div class="layout">
    <AppHeader />
    <main class="main">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
  title: t('site.title'),
  meta: [
    { name: 'description', content: t('site.description') },
    { name: 'keywords', content: t('site.keywords') },
    { property: 'og:title', content: t('site.ogTitle') },
    { property: 'og:description', content: t('site.ogDescription') },
    { property: 'og:type', content: 'website' },
  ],
}))
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
}
</style>
