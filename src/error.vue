<template>
  <div class="error-page">
    <div class="error-page__content">
      <h1 class="error-page__code">404</h1>
      <h2 class="error-page__title">{{ t('error.notFound') }}</h2>
      <p class="error-page__description">{{ t('error.notFoundDesc') }}</p>
      <NuxtLink to="/" class="btn btn-primary">{{ t('error.backHome') }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: '404 - Page Not Found'
})
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  text-align: center;
  min-height: 50vh;
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
