<template>
  <main class="publication-page" v-if="publication">
    <!-- Decorative background -->
    <div class="publication__bg">
      <div class="publication__pattern"></div>
      <div class="publication__shapes">
        <span class="publication__shape publication__shape--1"></span>
        <span class="publication__shape publication__shape--2"></span>
      </div>
    </div>

    <div class="container publication-page__container">
      <!-- Back button -->
      <NuxtLink to="/publications" class="publication__back">
        <ArrowLeft class="icon-inline" theme="outline" :size="16" fill="currentColor" :stroke-width="2" />
        {{ t('publications.backTo') }}
      </NuxtLink>

      <!-- Publication Header -->
      <div class="publication-header animate-fade-in-up">
        <div class="publication-header__meta">
          <span class="publication-header__year">{{ publication.year }}</span>
          <span v-if="publication.venue" class="badge badge-accent">{{ publication.venue }}</span>
        </div>
        <h1 class="publication-header__title">{{ publication.title }}</h1>
        <p class="publication-header__authors">{{ formattedAuthors }}</p>
      </div>

      <!-- Publication Content -->
      <div class="publication-content">
        <!-- Abstract -->
        <div v-if="publication.abstract || publication.body" class="publication-section animate-fade-in-up delay-200">
          <div class="publication-section__header">
            <FileStaff class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('publications.abstract') }}</h3>
          </div>
          <div class="publication-section__body publication-section__body--content">
            <ContentRenderer :value="publication" />
          </div>
        </div>

        <!-- Keywords -->
        <div v-if="publication.keywords && publication.keywords.length" class="publication-section animate-fade-in-up delay-300">
          <div class="publication-section__header">
            <Key class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('publications.keywords') }}</h3>
          </div>
          <div class="publication-section__body">
            <div class="keyword-tags">
              <span v-for="keyword in publication.keywords" :key="keyword" class="keyword-tag">
                {{ keyword }}
              </span>
            </div>
          </div>
        </div>

        <!-- DOI Link -->
        <div v-if="publication.doi" class="animate-fade-in-up delay-400">
          <a
            :href="publication.doi"
            target="_blank"
            rel="noopener"
            class="doi-link"
          >
            <LinkOut class="icon-inline" theme="outline" :size="18" fill="currentColor" :stroke-width="2.8" />
            {{ t('publications.viewOnPublisherSite') }}
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
        <h1>{{ t('publications.notFound') }}</h1>
        <p>{{ t('publications.notFoundDesc') }}</p>
        <NuxtLink to="/publications" class="btn btn-primary">{{ t('publications.browseAll') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArrowLeft from '@icon-park/vue-next/es/icons/ArrowLeft'
import FileStaff from '@icon-park/vue-next/es/icons/FileStaff'
import Key from '@icon-park/vue-next/es/icons/Key'
import LinkOut from '@icon-park/vue-next/es/icons/LinkOut'
import Help from '@icon-park/vue-next/es/icons/Help'

const { t } = useI18n()
const route = useRoute()

// Get publication by file path
// For catch-all route [...slug], params.slug is an array like ['2022', 'sensors-sensor-fusion']
const slug = computed(() => {
  const slugParam = route.params.slug
  return Array.isArray(slugParam) ? slugParam.join('/') : slugParam
})

const { data: publicationData } = await useAsyncData(`publication-${slug.value}`, async () => {
  try {
    const fullPath = `/publications/${slug.value}`
    return await queryContent(fullPath).findOne()
  } catch (e) {
    console.error('Error fetching publication:', e)
    return null
  }
}, {
  watch: [slug]
})

const publication = computed(() => publicationData.value)

// Provide content ID for ProseImg/ProseVideo to resolve relative asset paths
provide('contentId', computed(() => publication.value?._id || ''))

const formattedAuthors = computed(() => {
  if (!publication.value?.authors) return ''
  const authors = publication.value.authors
  if (authors.length <= 2) return authors.join(t('publications.authorSep'))
  return authors.slice(0, authors.length - 1).join(', ') + ', ' + t('publications.authorSep') + authors[authors.length - 1]
})

useHead({
  title: computed(() => publication.value ? `${publication.value.title} - ${t('site.shortName')}` : 'Publication Not Found'),
  meta: computed(() => {
    const description = publication.value?.abstract || publication.value?.body
      ? (typeof (publication.value.abstract || publication.value.body) === 'string'
          ? (publication.value.abstract || publication.value.body).substring(0, 160).replace(/<[^>]*>/g, '')
          : `${t('site.shortName')} publication`)
      : `${t('site.shortName')} publication page`
    return [
      { name: 'description', content: description }
    ]
  })
})
</script>

<style scoped>
.publication-page {
  min-height: 100vh;
  position: relative;
}

/* Page Container with top padding for fixed header */
.publication-page__container {
  padding-top: 100px;
}

/* Background */
.publication__bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
  z-index: -2;
  pointer-events: none;
}

.publication__pattern {
  position: absolute;
  inset: 0;
  background-image: var(--page-grid-pattern-strong);
  background-size: 40px 40px;
}

.publication__shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.publication__shape {
  position: absolute;
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.publication__shape--1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 8%;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  opacity: 0.12;
  animation-delay: 0s;
}

.publication__shape--2 {
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
.publication__back {
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

.publication__back:hover {
  background: var(--surface-brand);
  border-color: var(--surface-brand);
  color: var(--color-on-brand);
  transform: translateX(-3px);
}

/* Publication Header */
.publication-header {
  margin-bottom: var(--spacing-3xl);
}

.publication-header__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.publication-header__year {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
}

.badge-accent {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.publication-header__title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.publication-header__authors {
  font-size: 1rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* Content Area */
.publication-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
}

/* Publication Sections */
.publication-section {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all var(--transition-base);
}

.publication-section:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-secondary);
}

.publication-section__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-on-brand);
}

.publication-section__header h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: inherit;
  margin: 0;
}

.publication-section__body {
  padding: var(--spacing-xl);
}

.publication-section__body--content {
  padding: var(--spacing-xl);
  background: var(--surface-raised);
}

/* Keywords */
.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.keyword-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.keyword-tag:hover {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-on-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* DOI Link */
.doi-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-secondary);
  color: var(--color-on-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: all var(--transition-base);
}

.doi-link:hover {
  background: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* ContentRenderer Markdown Styling */
.publication-section__body--content :deep(h2) {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.publication-section__body--content :deep(p) {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
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
  .publication-content {
    gap: var(--spacing-lg);
  }
}
</style>
