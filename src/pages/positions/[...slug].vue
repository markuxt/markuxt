<template>
  <main class="position-page" v-if="position">
    <!-- Decorative background -->
    <div class="position__bg">
      <div class="position__pattern"></div>
      <div class="position__shapes">
        <span class="position__shape position__shape--1"></span>
        <span class="position__shape position__shape--2"></span>
      </div>
    </div>

    <div class="container position-page__container">
      <!-- Back button -->
      <NuxtLink to="/positions" class="position__back">
        <ArrowLeft class="icon-inline" theme="outline" :size="16" fill="currentColor" :stroke-width="2" />
        {{ t('positions.backTo') }}
      </NuxtLink>

      <!-- Position Header -->
      <div class="position-header animate-fade-in-up">
        <div class="position-header__info">
          <span v-if="position.type" class="position-header__badge badge-accent">
            {{ position.type }}
          </span>
          <h1 class="position-header__name">{{ position.title }}</h1>
        </div>
      </div>

      <!-- Position Content -->
      <div class="position-content">
        <!-- Description — only render when the body has renderable content;
             an empty .md parses to a { children: [] } AST that would otherwise
             make <ContentRenderer> dump its props as JSON. -->
        <div v-if="position.body?.children?.length" class="position-section animate-fade-in-up delay-200">
          <div class="position-section__header">
            <FileStaff class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('positions.aboutPosition') }}</h3>
          </div>
          <div class="position-section__body position-section__body--content">
            <ContentRenderer :value="position" />
          </div>
        </div>

        <!-- Requirements -->
        <div v-if="position.requirements" class="position-section animate-fade-in-up delay-300">
          <div class="position-section__header">
            <CheckCorrect class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('positions.requirements') }}</h3>
          </div>
          <div class="position-section__body">
            <ul class="requirements-list">
              <li v-for="(req, index) in position.requirements" :key="index">{{ req }}</li>
            </ul>
          </div>
        </div>

        <!-- Apply Button -->
        <div v-if="position.email" class="animate-fade-in-up delay-400">
          <a
            :href="`mailto:${position.email}`"
            class="apply-link"
          >
            <Mail class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="3" />
            {{ t('positions.apply') }}
          </a>
        </div>
      </div>
    </div>
  </main>

  <!-- Not Found -->
  <div v-else class="not-found-page">
    <div class="container">
      <div class="not-found">
        <Help class="icon-inline" theme="outline" :size="80" fill="var(--color-accent)" :stroke-width="3" />
        <h1>{{ t('positions.notFound') }}</h1>
        <p>{{ t('positions.notFoundDesc') }}</p>
        <NuxtLink to="/positions" class="btn btn-primary">{{ t('positions.browseAll') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArrowLeft from '@icon-park/vue-next/es/icons/ArrowLeft'
import FileStaff from '@icon-park/vue-next/es/icons/FileStaff'
import CheckCorrect from '@icon-park/vue-next/es/icons/CheckCorrect'
import Mail from '@icon-park/vue-next/es/icons/Mail'
import Help from '@icon-park/vue-next/es/icons/Help'

const { t } = useI18n()
const { $i18n } = useNuxtApp()
const defaultLocale = useDefaultLocale()
const locale = computed(() => (route.query.lang as string) || ($i18n as any)?.locale?.value || 'en')
const route = useRoute()

// Get position by file path
// For catch-all route [...slug], params.slug is an array
const slug = computed(() => {
  const slugParam = route.params.slug
  return Array.isArray(slugParam) ? slugParam.join('/') : slugParam
})

const { data: positionData } = await useAsyncData(`position-${slug.value}-${locale.value}`, async () => {
  try {
    const fullPath = `/positions/${slug.value}`
    return await findOneContentDoc(fullPath, locale.value, defaultLocale)
  } catch (e) {
    console.error('Error fetching position:', e)
    return null
  }
}, {
  watch: [slug, locale]
})

const position = computed(() => positionData.value)

// Provide content ID for ProseImg/ProseVideo to resolve relative asset paths
provide('contentId', computed(() => position.value?._id || ''))

useHead({
  title: computed(() => position.value ? `${position.value.title} - ${t('site.shortName')}` : 'Position Not Found'),
  meta: computed(() => {
    const description = position.value?.description || position.value?.body
      ? (typeof (position.value.description || position.value.body) === 'string'
          ? (position.value.description || position.value.body).substring(0, 160).replace(/<[^>]*>/g, '')
          : `${t('site.shortName')} position`)
      : `${t('site.shortName')} position page`
    return [
      { name: 'description', content: description }
    ]
  })
})
</script>

<style scoped>
.position-page {
  min-height: 100vh;
  position: relative;
}

/* Page Container with top padding for fixed header */
.position-page__container {
  padding-top: 100px;
}

/* Background */
.position__bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
  z-index: -2;
  pointer-events: none;
}

.position__pattern {
  position: absolute;
  inset: 0;
  background-image: var(--page-grid-pattern-strong);
  background-size: 40px 40px;
}

.position__shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.position__shape {
  position: absolute;
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.position__shape--1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 8%;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  opacity: 0.12;
  animation-delay: 0s;
}

.position__shape--2 {
  width: 120px;
  height: 120px;
  bottom: 20%;
  left: 5%;
  background: var(--surface-brand);
  opacity: 0.08;
  animation-delay: 2.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(3deg);
  }
}

/* Back Button */
.position__back {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-frosted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-base);
  margin-bottom: var(--spacing-xl);
}

.position__back:hover {
  background: var(--surface-brand);
  border-color: var(--surface-brand);
  color: var(--color-on-brand);
  transform: translateX(-3px);
}

/* Position Header */
.position-header {
  margin-bottom: var(--spacing-3xl);
}

.position-header__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.position-header__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-on-accent);
  background: var(--color-accent);
  border-radius: var(--radius-sm);
  align-self: flex-start;
}

.position-header__name {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--color-primary);
  margin: 0;
}

/* Content Area */
.position-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
}

/* Position Sections */
.position-section {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all var(--transition-base);
}

.position-section:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-secondary);
}

.position-section__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-on-brand);
}

.position-section__header h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: inherit;
  margin: 0;
}

.position-section__body {
  padding: var(--spacing-xl);
}

.position-section__body--content {
  padding: var(--spacing-xl);
  background: var(--surface-raised);
}

/* Requirements List */
.requirements-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.requirements-list li {
  padding-left: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  position: relative;
}

.requirements-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 1.2em;
}

/* Apply Link */
.apply-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-secondary);
  color: var(--color-on-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: all var(--transition-base);
}

.apply-link:hover {
  background: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* ContentRenderer Markdown Styling */
.position-section__body--content :deep(h2) {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.position-section__body--content :deep(p) {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.position-section__body--content :deep(ul) {
  list-style: none;
  padding-left: 0;
}

.position-section__body--content :deep(li) {
  padding-left: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  position: relative;
}

.position-section__body--content :deep(li::before) {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: 700;
}

.position-section__body--content :deep(strong) {
  font-weight: 600;
  color: var(--color-primary);
}

/* Not Found */
.not-found-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.not-found {
  text-align: center;
  padding: var(--spacing-4xl) 0;
  max-width: 400px;
  margin: 0 auto;
}

.not-found h1 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.not-found p {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .position-content {
    gap: var(--spacing-lg);
  }
}
</style>
