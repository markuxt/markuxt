<template>
  <div class="section-title" :class="`section-title--${align}`">
    <span class="section-title__overline" v-if="overline">{{ overline }}</span>
    <h2 class="section-title__title">{{ title }}</h2>
    <p class="section-title__description" v-if="description">
      {{ description }}
    </p>
    <div class="section-title__line"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  overline?: string
  description?: string
  align?: 'left' | 'center'
}

withDefaults(defineProps<Props>(), {
  align: 'left'
})
</script>

<style scoped>
.section-title {
  margin-bottom: var(--spacing-2xl);
}

.section-title--center {
  text-align: center;
}

.section-title--center .section-title__line {
  margin-left: auto;
  margin-right: auto;
}

.section-title__overline {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-secondary);
  margin-bottom: var(--spacing-sm);
}

.section-title__title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.section-title__description {
  font-size: 1.125rem;
  color: var(--color-text-muted);
  max-width: 600px;
}

.section-title--center .section-title__description {
  margin-left: auto;
  margin-right: auto;
}

.section-title__line {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-secondary));
  border-radius: 2px;
  margin-top: var(--spacing-md);
}
</style>
