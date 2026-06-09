<template>
  <div class="projects-page">
    <div class="section">
      <div class="container">
        <SectionTitle
          :overline="t('home.research')"
          :title="t('nav.projects')"
          :description="t('projects.description')"
        />

        <!-- Status Filter -->
        <div class="status-filter" v-if="projectList.length > 0">
          <button
            v-for="filter in statusFilters"
            :key="filter.key"
            class="status-filter__btn"
            :class="{ 'status-filter__btn--active': activeFilter === filter.key }"
            @click="activeFilter = filter.key"
          >
            <span class="status-filter__dot" :class="`status-dot--${filter.key}`"></span>
            {{ filter.name }}
            <span class="tooltip">{{ filter.tooltip }}</span>
          </button>
        </div>

        <!-- Projects Grid -->
        <div class="projects-grid" v-if="filteredProjects.length > 0">
          <NuxtLink
            v-for="project in filteredProjects"
            :key="project._path"
            :to="project._path || ''"
            class="project-card"
          >
            <div class="project-card__image-wrapper" v-if="project.image">
              <img :src="getProjectImage(project.image, project._id)" :alt="project.title" class="project-card__image" />
            </div>
            <div class="project-card__image-placeholder" v-else>
              <component :is="getStatusIcon(project.status)" class="icon-inline" theme="outline" :size="48" fill="currentColor" :stroke-width="1.5" />
            </div>
            <div class="project-card__content">
              <div class="project-card__header">
                <h3 class="project-card__title">{{ project.title }}</h3>
                <span v-if="project.status" class="status-badge" :class="`status-badge--${project.status}`">
                  <span class="status-badge__dot"></span>
                  {{ statusLabels[project.status as ProjectStatus] || project.status }}
                  <span class="tooltip tooltip--badge">{{ statusTooltips[project.status as ProjectStatus] }}</span>
                </span>
              </div>
              <p class="project-card__description" v-if="project.description">
                {{ project.description }}
              </p>
              <div class="project-card__meta" v-if="project.year || project.funded">
                <span v-if="project.year" class="project-card__year">{{ project.year }}</span>
                <span v-if="project.funded" class="project-card__funded">
                  <Funds class="icon-inline" theme="outline" :size="14" fill="currentColor" :stroke-width="3" />
                  {{ t('projects.funded') }}
                  <span class="tooltip tooltip--badge">{{ t('projects.fundedTooltip') }}</span>
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="projects-placeholder" v-else-if="projectList.length === 0">
          <div class="placeholder-icon">
            <Experiment class="icon-inline" theme="outline" :size="64" fill="var(--color-accent)" :stroke-width="2" />
          </div>
          <h3>{{ t('projects.comingSoon') }}</h3>
          <p>{{ t('projects.comingSoonDesc') }}</p>
          <NuxtLink to="/publications" class="btn btn-secondary">{{ t('projects.viewPublications') }}</NuxtLink>
        </div>

        <div class="no-results" v-else>
          <p>{{ t('projects.noResults') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Experiment from '@icon-park/vue-next/es/icons/Experiment'
import Funds from '@icon-park/vue-next/es/icons/Funds'
import Lightning from '@icon-park/vue-next/es/icons/Lightning'
import Timer from '@icon-park/vue-next/es/icons/Timer'
import CheckOne from '@icon-park/vue-next/es/icons/CheckOne'
import Setting from '@icon-park/vue-next/es/icons/Setting'
import Help from '@icon-park/vue-next/es/icons/Help'

const { t } = useI18n()

interface Project {
  title: string
  description?: string
  status?: string
  year?: number
  image?: string
  funded?: boolean
  _path?: string
  _id?: string
}

const config = useRuntimeConfig()

type ProjectStatus = 'open' | 'ongoing' | 'completed' | 'maintained'

// Status definitions with labels and meanings
const statusLabels = computed(() => ({
  'open': t('projects.statusOpen'),
  'ongoing': t('projects.statusOngoing'),
  'completed': t('projects.statusCompleted'),
  'maintained': t('projects.statusMaintained')
}) satisfies Record<ProjectStatus, string>)

const statusTooltips = computed(() => ({
  'open': t('projects.tooltipOpen'),
  'ongoing': t('projects.tooltipOngoing'),
  'completed': t('projects.tooltipCompleted'),
  'maintained': t('projects.tooltipMaintained')
}) satisfies Record<ProjectStatus, string>)

const statusFilters = computed(() => [
  { key: 'all', name: t('projects.filterAll'), tooltip: t('projects.tooltipAll') },
  { key: 'open', name: t('projects.statusOpen'), tooltip: t('projects.tooltipOpen') },
  { key: 'ongoing', name: t('projects.statusOngoing'), tooltip: t('projects.tooltipOngoing') },
  { key: 'completed', name: t('projects.statusCompleted'), tooltip: t('projects.tooltipCompleted') },
  { key: 'maintained', name: t('projects.statusMaintained'), tooltip: t('projects.tooltipMaintained') }
])

const activeFilter = ref('all')

// Icon mapping for status
const statusIconMap: Record<string, any> = {
  'open': Lightning,
  'ongoing': Timer,
  'completed': CheckOne,
  'maintained': Setting
}

const getStatusIcon = (status?: string) => {
  return statusIconMap[status || ''] || Help
}

// Fetch projects
const { data: projects } = await useAsyncData('projects', () =>
  queryContent('/projects')
    .where({ _hidden: { $ne: true } })
    .where({ _extension: 'md' }).find()
)

const projectList = computed(() => projects.value ?? [])

const filteredProjects = computed(() => {
  if (activeFilter.value === 'all') {
    return projectList.value
  }
  return projectList.value.filter(p => p.status === activeFilter.value)
})

// Handle image paths: resolve relative content paths, then apply base URL
const getProjectImage = (imagePath?: string, contentId?: string) => {
  const resolved = resolveContentImage(imagePath, contentId)
  if (!resolved) return ''
  const basePath = config.app.baseURL || ''
  if (!basePath || basePath === '/') return resolved
  return basePath + resolved
}

useHead({
  title: t('projects.pageTitle'),
  meta: [
    { name: 'description', content: t('projects.pageDescription') }
  ]
})
</script>

<style scoped>
.projects-page {
  padding-top: var(--spacing-xl);
}

/* Status Filter */
.status-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-sm);
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.status-filter__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.status-filter__btn:hover {
  background: var(--surface-soft);
  color: var(--color-text);
}

.status-filter__btn--active {
  background: var(--surface-raised);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.status-filter__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--all { background: var(--color-text-muted); }
.status-dot--open { background: var(--status-open-solid); }
.status-dot--ongoing { background: var(--status-ongoing-solid); }
.status-dot--completed { background: var(--status-completed-solid); }
.status-dot--maintained { background: var(--status-maintained-solid); }

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-xl);
}

.project-card {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
  text-decoration: none;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  border-color: var(--color-secondary);
  box-shadow: var(--shadow-xl);
  transform: translateY(-4px);
}

.project-card__image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
}

.project-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.project-card:hover .project-card__image {
  transform: scale(1.05);
}

.project-card__image-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
  color: var(--color-on-brand-soft);
}

.project-card__content {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.project-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.project-card__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.3;
  flex: 1;
}

.project-card__description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
  flex: 1;
}

.project-card__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: auto;
}

.project-card__year {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.project-card__funded {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-accent);
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Open - recruiting, no funding */
.status-badge--open {
  background: var(--status-open-bg);
  color: var(--status-open-text);
}
.status-badge--open .status-badge__dot {
  background: var(--status-open-solid);
}

/* Ongoing - recruiting with funding */
.status-badge--ongoing {
  background: var(--status-ongoing-bg);
  color: var(--status-ongoing-text);
}
.status-badge--ongoing .status-badge__dot {
  background: var(--status-ongoing-solid);
  animation: pulse 1.5s ease-in-out infinite;
}

/* Completed - not recruiting */
.status-badge--completed {
  background: var(--status-completed-bg);
  color: var(--status-completed-text);
}
.status-badge--completed .status-badge__dot {
  background: var(--status-completed-solid);
  animation: none;
}

/* Maintained - still maintained */
.status-badge--maintained {
  background: var(--status-maintained-bg);
  color: var(--status-maintained-text);
}
.status-badge--maintained .status-badge__dot {
  background: var(--status-maintained-solid);
  animation: none;
}

/* No results */
.no-results {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
}

/* Placeholder */
.projects-placeholder {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-lg);
  background: var(--color-bg-alt);
  border-radius: var(--radius-2xl);
  border: 1px dashed var(--color-border);
}

.placeholder-icon {
  margin-bottom: var(--spacing-lg);
}

.projects-placeholder h3 {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.projects-placeholder p {
  font-size: 1.0625rem;
  color: var(--color-text-muted);
  max-width: 500px;
  margin: 0 auto var(--spacing-xl);
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .status-filter {
    justify-content: center;
  }

  .project-card__header {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}

/* Tooltip Styles */
.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-brand);
  color: var(--color-on-brand);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-fast);
  z-index: 100;
  pointer-events: none;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--surface-brand);
}

.status-filter__btn:hover .tooltip,
.status-badge:hover .tooltip,
.project-card__funded:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

/* Badge tooltip - positioned above */
.tooltip--badge {
  bottom: calc(100% + 6px);
}
</style>
