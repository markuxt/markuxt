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
const appConfig = useAppConfig()
const { t, locale } = useI18n()

const themePreset = computed(() => {
  const preset = appConfig.markuxt?.theme?.preset

  if (preset === 'forest' || preset === 'sunset' || preset === 'slate') {
    return preset
  }

  return 'ocean'
})

const themeMode = computed(() => {
  const mode = appConfig.markuxt?.theme?.mode

  if (mode === 'dark' || mode === 'auto') {
    return mode
  }

  return 'light'
})

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
    'data-theme': themePreset.value,
    'data-color-mode': themeMode.value,
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
