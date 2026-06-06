<template>
  <div class="positions-page">
    <div class="section">
      <div class="container">
        <SectionTitle
          :overline="t('positions.overline')"
          :title="t('positions.title')"
          :description="t('positions.description')"
        />

        <div class="positions-intro">
          <p>
            {{ t('positions.intro') }}
          </p>
        </div>

        <!-- Positions Grid -->
        <div class="positions-grid" v-if="positionsList.length > 0">
          <NuxtLink
            v-for="position in positionsList"
            :key="position._path"
            :to="position._path || ''"
            class="position-card"
          >
            <div class="position-card__header">
              <h3 class="position-card__title">{{ position.title }}</h3>
              <span v-if="position.type" class="badge badge-accent">{{ position.type }}</span>
            </div>
            <p class="position-card__description" v-if="position.description">
              {{ position.description }}
            </p>
            <div class="position-card__footer">
              <span class="position-card__cta">{{ t('positions.viewDetails') }}</span>
            </div>
          </NuxtLink>
        </div>

        <div class="positions-coming-soon" v-else>
          <div class="placeholder-icon">
            <Briefcase class="icon-inline" theme="outline" :size="64" fill="var(--color-accent)" :stroke-width="2" />
          </div>
          <h3>{{ t('positions.noPositions') }}</h3>
          <p>{{ t('positions.checkBack') }}</p>
        </div>

        <!-- General Inquiry -->
        <div class="positions-contact">
          <h3>{{ t('positions.interested') }}</h3>
          <p>
            {{ t('positions.contactText') }}
          </p>
          <a :href="`mailto:${contactEmail}`" class="btn btn-primary" v-if="contactEmail">
            {{ t('positions.contactDirector') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Briefcase from '@icon-park/vue-next/lib/icons/Briefcase'

const { t } = useI18n()
const appConfig = useAppConfig()
const contactEmail = computed(() => appConfig.markuxt?.contact?.email || '')

interface Position {
  title: string
  description?: string
  type?: string
  _path?: string
}

// Fetch positions
const { data: positions } = await useAsyncData('positions', () =>
  queryContent('/positions')
    .where({ _hidden: { $ne: true } })
    .where({ _extension: 'md' }).find()
)

const positionsList = computed(() => positions.value || [])

useHead({
  title: t('positions.pageTitle'),
  meta: [
    { name: 'description', content: t('positions.pageDescription') }
  ]
})
</script>

<style scoped>
.positions-page {
  padding-top: var(--spacing-xl);
}

.positions-intro {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
  border-left: 4px solid var(--color-secondary);
}

.positions-intro p {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--color-text-muted);
  margin: 0;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
}

.position-card {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
  text-decoration: none;
  display: flex;
  flex-direction: column;
}

.position-card:hover {
  border-color: var(--color-secondary);
  box-shadow: var(--shadow-xl);
  transform: translateY(-4px);
}

.position-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.position-card__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
  line-height: 1.3;
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
  flex-shrink: 0;
}

.badge-accent {
  background: var(--color-accent);
  color: white;
}

.position-card__description {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
  flex: 1;
}

.position-card__footer {
  margin-top: auto;
}

.position-card__cta {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-secondary);
  transition: color var(--transition-fast);
}

.position-card:hover .position-card__cta {
  color: var(--color-accent);
}

/* Coming Soon */
.positions-coming-soon {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-lg);
  background: var(--color-bg-alt);
  border-radius: var(--radius-2xl);
  border: 1px dashed var(--color-border);
  margin-bottom: var(--spacing-3xl);
}

.placeholder-icon {
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: center;
  align-items: center;
}

.positions-coming-soon h3 {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.positions-coming-soon p {
  font-size: 1.0625rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Contact Section */
.positions-contact {
  text-align: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border-radius: var(--radius-2xl);
  padding: var(--spacing-3xl) var(--spacing-xl);
}

.positions-contact h3 {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-md);
}

.positions-contact p {
  font-size: 1.0625rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto var(--spacing-xl);
}

.positions-contact .btn {
  background: white;
  color: var(--color-primary);
  border-radius: var(--radius-full); /* pill */
  padding: 0.75rem 1.25rem;
  box-shadow: 0 6px 18px rgba(2,6,23,0.08);
}

.positions-contact .btn:hover {
  background: var(--color-accent);
  color: white;
}

@media (max-width: 768px) {
  .positions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
