<template>
  <div class="error-page">
    <div class="error-page__content">
      <h1 class="error-page__code">{{ statusCode }}</h1>
      <h2 class="error-page__title">{{ t('error.notFound') }}</h2>
      <p class="error-page__description">{{ t('error.notFoundDesc') }}</p>
      <NuxtLink to="/" class="btn btn-primary">{{ t('error.backHome') }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode || 404)

// The error page can render before vue-i18n is installed — e.g. an error during
// app initialization, when Nuxt recovers into the error boundary. `useI18n()`
// throws NOT_INSTALLED in that case and would blank the entire site, so access
// the instance defensively via the Nuxt app and fall back to plain English.
const nuxtApp = useNuxtApp()
const FALLBACK: Record<string, string> = {
  'error.notFound': 'Page Not Found',
  'error.notFoundDesc': 'The page you are looking for could not be found.',
  'error.backHome': 'Back to Home',
}
const t = (key: string): string => {
  try {
    const i18n = nuxtApp.$i18n as { t?: (key: string) => string } | undefined
    if (i18n && typeof i18n.t === 'function') return i18n.t(key)
  } catch {
    // ignore — fall through to English fallback
  }
  return FALLBACK[key] ?? key
}

useHead({
  title: () => `${statusCode.value} - Page Not Found`,
})
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl, 4rem) var(--spacing-lg, 1.5rem);
  text-align: center;
  /* Fill the whole viewport so the content is vertically centered in the
     *entire* window, not just the top half. (Falls back gracefully if the
     theme tokens ever fail to load.) */
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
}

.error-page__content {
  max-width: 480px;
}

.error-page__code {
  font-family: var(--font-display);
  font-size: 8rem;
  font-weight: 900;
  line-height: 1;
  color: var(--color-secondary);
  margin-bottom: var(--spacing-md);
  opacity: 0.3;
}

.error-page__title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.error-page__description {
  font-size: 1rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: var(--spacing-2xl);
}
</style>
