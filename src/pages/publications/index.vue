<template>
  <div class="publications-page">
    <div class="section">
      <div class="container">
        <SectionTitle
          :overline="t('home.research')"
          :title="t('nav.publications')"
          :description="t('publications.description')"
        />

        <!-- Publications List Grouped by Year -->
        <div class="publications-list" v-if="publicationsByYear.length > 0">
          <div
            v-for="yearGroup in publicationsByYear"
            :key="yearGroup.year"
            class="publication-year-group"
          >
            <h3 class="publication-year">{{ yearGroup.year }}</h3>
            <div class="publication-year__grid">
              <PublicationCard
                v-for="pub in yearGroup.publications"
                :key="pub._path || pub.title"
                :publication="pub"
              />
            </div>
          </div>
        </div>

        <p v-else class="no-results">
          {{ t('publications.noResults') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Publication {
  title: string
  authors: string[]
  year: number
  doi?: string
  venue?: string
  keywords?: string[]
  abstract?: string
  _path?: string
}

const { t } = useI18n()

// Fetch all publications
const _locale = useActiveLocale()
const _defaultLocale = useDefaultLocale()
const { data: publications } = await useAsyncData(`publications-${_locale}`, async () => {
  const docs = await queryContent('/publications')
    .where({ _hidden: { $ne: true } })
    .where({ _extension: 'md' }).find()
  return dedupeByPath(docs, _locale, _defaultLocale)
}, { watch: [() => useActiveLocale()] })

const processedPublications = computed(() => {
  return (publications.value || []).map(pub => ({
    ...pub,
    title: pub.title ?? t('publications.untitled'),
    authors: pub.authors || [],
    year: pub.year || new Date().getFullYear(),
    keywords: pub.keywords || [],
    abstract: pub.description || pub.abstract
  }))
})

// Group by year
const publicationsByYear = computed(() => {
  const grouped: Record<number, Publication[]> = {}

  for (const pub of processedPublications.value) {
    if (!grouped[pub.year]) {
      grouped[pub.year] = []
    }
    grouped[pub.year].push(pub)
  }

  return Object.entries(grouped)
    .map(([year, pubs]) => ({
      year: parseInt(year),
      publications: pubs.sort((a, b) => a.title.localeCompare(b.title))
    }))
    .sort((a, b) => b.year - a.year)
})

useHead({
  title: t('publications.pageTitle'),
  meta: [
    { name: 'description', content: t('publications.pageDescription') }
  ]
})
</script>

<style scoped>
.publications-page {
  padding-top: var(--spacing-xl);
}

.publications-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3xl);
}

.publication-year-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.publication-year {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border);
}

.publication-year__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.no-results {
  text-align: center;
  padding: var(--spacing-3xl);
  font-size: 1.125rem;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .publication-year {
    font-size: 1.5rem;
  }

  .publication-year__grid {
    grid-template-columns: 1fr;
  }
}
</style>
