<template>
  <div class="home-page">
    <Hero />

    <!-- Latest News -->
    <section class="section" v-if="latestNews.length > 0">
      <div class="container">
        <SectionTitle
          :title="t('home.latestNews')"
          :description="t('home.newsDescription')"
          align="center"
        />
        <div class="news-grid">
          <NewsCard
            v-for="item in latestNews"
            :key="item._path"
            :news="item"
          />
        </div>
        <div class="section__actions" v-if="hasMoreNews">
          <NuxtLink to="/news" class="btn btn-secondary">
            {{ t('home.viewAllNews') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Featured Members -->
    <section class="section" v-if="featuredMembers.length > 0">
      <div class="container">
        <SectionTitle
          :overline="t('home.ourTeam')"
          :title="t('home.meetMembers')"
          :description="t('home.teamDescription')"
          align="center"
        />
        <MembersGrid :members="featuredMembers" :groupBy="false" />
        <div class="section__actions">
          <NuxtLink to="/members" class="btn btn-primary">
            {{ t('home.viewAllMembers') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Research Areas -->
    <section class="section section--alt" v-if="researchAreas.length > 0">
      <div class="container">
        <SectionTitle
          :overline="t('home.research')"
          :title="t('home.researchAreas')"
          align="center"
        />
        <div class="research-areas">
          <div class="research-card" v-for="(area, index) in researchAreas" :key="index">
            <span class="research-card__icon"><component class="icon-inline" :is="area.component" theme="outline" :size="28" fill="white" :stroke-width="3"/></span>
            <h3 class="research-card__title">{{ area.title }}</h3>
            <p class="research-card__description">{{ area.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'

const { t } = useI18n()
const appConfig = useAppConfig()

// Fetch latest news
const { data: allNews } = await useAsyncData('home-news', () =>
  queryContent('/news')
    .where({ _hidden: { $ne: true } })
    .sort({ date: -1 })
    .limit(3)
    .where({ _extension: 'md' }).find()
)

const latestNews = computed(() => allNews.value || [])
const hasMoreNews = computed(() => latestNews.value.length >= 3)

// Fetch featured members
const { data: allMembers } = await useAsyncData('home-members', () =>
  queryContent('/members')
    .where({ category: 'staff', _hidden: { $ne: true } })
    .limit(4)
    .where({ _extension: 'md' }).find()
)

const featuredMembers = computed(() => {
  return (allMembers.value || []).map(member => ({
    ...member,
    slug: member._path?.split('/').pop() || member.slug,
    name: member.name || member.title || 'Unnamed Member'
  }))
})

interface ResearchAreaConfig {
  icon: string
  titleKey: string
  descKey: string
}

// Research areas — driven by app.config, icons resolved by consuming project
const researchAreas = computed(() => {
  const areas = (appConfig.markuxt as Record<string, any>)?.researchAreas as ResearchAreaConfig[] || []
  return areas.map((area) => ({
    title: t(area.titleKey),
    description: t(area.descKey),
    component: resolveComponent(area.icon),
  }))
})

useHead({
  title: t('home.pageTitle')
})
</script>

<style scoped>
.home-page {
  padding-top: 0;
}

.section--alt {
  background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.section__actions {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-xl);
}

/* Research Areas */
.research-areas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-xl);
  position: relative;
}

.research-areas::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(10, 37, 64, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(10, 37, 64, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.research-card {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.research-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-secondary);
}

.research-card:hover .research-card__icon {
  transform: scale(1.1) rotate(5deg);
}

.research-card__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  border-radius: var(--radius-full);
  position: relative;
  z-index: 1;
}

.research-card__icon :deep(.icon-container) {
  position: relative;
  z-index: 2;
}

.research-card__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.research-card__description {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .research-areas {
    grid-template-columns: 1fr;
  }

  .research-card {
    padding: var(--spacing-lg);
  }

  .research-card__icon {
    width: 48px;
    height: 48px;
  }
}
</style>
