<template>
  <main class="project-page" v-if="project">
    <!-- Decorative background -->
    <div class="project__bg">
      <div class="project__pattern"></div>
      <div class="project__shapes">
        <span class="project__shape project__shape--1"></span>
        <span class="project__shape project__shape--2"></span>
      </div>
    </div>

    <div class="container project-page__container">
      <!-- Back button -->
      <NuxtLink to="/projects" class="project__back">
        <ArrowLeft class="icon-inline" theme="outline" :size="16" fill="currentColor" :stroke-width="2" />
        {{ t('projects.backTo') }}
      </NuxtLink>

      <!-- Project Header -->
      <div class="project-header animate-fade-in-up">
        <div class="project-header__image-wrapper" v-if="projectImage">
          <img :src="projectImage" :alt="project.title" class="project-header__image" />
        </div>
        <div class="project-header__info">
          <span v-if="project.status" class="project-header__badge" :class="`badge-${project.status}`">
            {{ project.status }}
          </span>
          <h1 class="project-header__name">{{ project.title }}</h1>
          <p v-if="project.year" class="project-header__year">{{ project.year }}</p>
        </div>
      </div>

      <!-- Project Content -->
      <div class="project-content">
        <!-- Description -->
        <div v-if="project.body || project.description" class="project-section animate-fade-in-up delay-200">
          <div class="project-section__header">
            <FileStaff class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('projects.aboutProject') }}</h3>
          </div>
          <div class="project-section__body project-section__body--content">
            <ContentRenderer :value="project" />
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Not Found -->
  <div v-else class="not-found-page">
    <div class="container">
      <div class="not-found">
        <Help class="icon-inline" theme="outline" :size="80" fill="var(--color-accent)" :stroke-width="3" />
        <h1>{{ t('projects.notFound') }}</h1>
        <p>{{ t('projects.notFoundDesc') }}</p>
        <NuxtLink to="/projects" class="btn btn-primary">{{ t('projects.browseAll') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArrowLeft from '@icon-park/vue-next/es/icons/ArrowLeft'
import FileStaff from '@icon-park/vue-next/es/icons/FileStaff'
import Help from '@icon-park/vue-next/es/icons/Help'

const { t } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()

// Get project by file path
// For catch-all route [...slug], params.slug is an array
const slug = computed(() => {
  const slugParam = route.params.slug
  return Array.isArray(slugParam) ? slugParam.join('/') : slugParam
})

const { data: projectData } = await useAsyncData(`project-${slug.value}`, async () => {
  try {
    const fullPath = `/projects/${slug.value}`
    return await queryContent(fullPath).findOne()
  } catch (e) {
    console.error('Error fetching project:', e)
    return null
  }
}, {
  watch: [slug]
})

const project = computed(() => projectData.value)

// Provide content ID for ProseImg/ProseVideo to resolve relative asset paths
provide('contentId', computed(() => project.value?._id || ''))

const projectImage = computed(() => {
  const resolved = resolveContentImage(project.value?.image, project.value?._id)
  if (!resolved) return ''
  const basePath = config.app.baseURL || ''
  if (!basePath || basePath === '/') return resolved
  return basePath + resolved
})

useHead({
  title: computed(() => project.value ? `${project.value.title} - ${t('site.shortName')}` : 'Project Not Found'),
  meta: computed(() => {
    const description = project.value?.description || project.value?.body
      ? (typeof (project.value.description || project.value.body) === 'string'
          ? (project.value.description || project.value.body).substring(0, 160).replace(/<[^>]*>/g, '')
          : `${t('site.shortName')} project`)
      : `${t('site.shortName')} project page`
    return [
      { name: 'description', content: description }
    ]
  })
})
</script>

<style scoped>
.project-page {
  min-height: 100vh;
  position: relative;
}

/* Page Container with top padding for fixed header */
.project-page__container {
  padding-top: 100px;
}

/* Background */
.project__bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
  z-index: -2;
  pointer-events: none;
}

.project__pattern {
  position: absolute;
  inset: 0;
  background-image: var(--page-grid-pattern-strong);
  background-size: 40px 40px;
}

.project__shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.project__shape {
  position: absolute;
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.project__shape--1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 8%;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  opacity: 0.12;
  animation-delay: 0s;
}

.project__shape--2 {
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
.project__back {
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

.project__back:hover {
  background: var(--surface-brand);
  border-color: var(--surface-brand);
  color: var(--color-on-brand);
  transform: translateX(-3px);
}

/* Project Header */
.project-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2xl);
  align-items: start;
  margin-bottom: var(--spacing-3xl);
}

.project-header__image-wrapper {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.project-header__image {
  width: 100%;
  height: auto;
  display: block;
}

.project-header__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.project-header__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: var(--radius-full);
  align-self: flex-start;
}

.badge-ongoing {
  background: var(--status-ongoing-bg);
  color: var(--status-ongoing-text);
}

.badge-completed {
  background: var(--status-completed-bg);
  color: var(--status-completed-text);
}

.badge-open {
  background: var(--status-open-bg);
  color: var(--status-open-text);
}

.badge-maintained {
  background: var(--status-maintained-bg);
  color: var(--status-maintained-text);
}

.project-header__name {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--color-primary);
  margin: 0;
}

.project-header__year {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

/* Content Area */
.project-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
}

/* Project Sections */
.project-section {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all var(--transition-base);
}

.project-section:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-secondary);
}

.project-section__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-on-brand);
}

.project-section__header h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: inherit;
  margin: 0;
}

.project-section__body {
  padding: var(--spacing-xl);
}

.project-section__body--content {
  padding: var(--spacing-xl);
  background: var(--surface-raised);
}

/* ContentRenderer Markdown Styling */
.project-section__body--content :deep(h2) {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.project-section__body--content :deep(h3) {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.project-section__body--content :deep(p) {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.project-section__body--content :deep(ul) {
  list-style: none;
  padding-left: 0;
}

.project-section__body--content :deep(li) {
  padding-left: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  position: relative;
}

/* Task-list (checkbox) items use the checkbox as their marker, not the
   bullet, so they need much less left padding than normal list items. */
.project-section__body--content :deep(.task-list-item) {
  padding-left: 0;
}

.project-section__body--content :deep(li::before) {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: 700;
}

.project-section__body--content :deep(a) {
  color: var(--color-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.project-section__body--content :deep(a:hover) {
  color: var(--color-accent);
}

.project-section__body--content :deep(strong) {
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
  .project-header {
    grid-template-columns: 1fr;
  }

  .project-content {
    gap: var(--spacing-lg);
  }
}
</style>
