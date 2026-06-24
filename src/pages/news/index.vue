<template>
  <div class="news-page">
    <div class="section">
      <div class="container">
        <SectionTitle
          :overline="t('news.overline')"
          :title="t('news.title')"
          :description="t('news.description')"
        />

        <div class="news-list" v-if="safeNewsItems.length > 0">
          <NewsCard
            v-for="item in safeNewsItems"
            :key="item._path"
            :news="item"
          />
        </div>

        <div class="news-empty" v-else>
          <div class="news-empty__icon">📰</div>
          <h3>{{ t('news.noNews') }}</h3>
          <p>{{ t('news.checkBack') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NewsItem {
  title: string
  date: string
  description?: string
  tags?: string[]
  _path: string
}

const { t } = useI18n()

// Fetch all news
const _locale = useActiveLocale()
const _defaultLocale = useDefaultLocale()
const { data: newsItems } = await useAsyncData(`news-${_locale}`, async () => {
  const docs = await queryContent('/news')
    .where({ _hidden: { $ne: true } })
    .sort({ date: -1 })
    .where({ _extension: 'md' }).find()
  return dedupeByPath(docs, _locale, _defaultLocale)
}, { watch: [() => useActiveLocale()] })

const safeNewsItems = computed(() =>
  (newsItems.value ?? []).filter((item: any) => typeof item.date === 'string') as unknown as NewsItem[]
)

useHead({
  title: t('news.pageTitle'),
  meta: [
    { name: 'description', content: t('news.pageDescription') }
  ]
})
</script>

<style scoped>
.news-page {
  padding-top: var(--spacing-xl);
}

.news-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-xl);
}

.news-empty {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-lg);
  background: var(--color-bg-alt);
  border-radius: var(--radius-2xl);
  border: 1px dashed var(--color-border);
}

.news-empty__icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.news-empty h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.news-empty p {
  font-size: 1.0625rem;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .news-list {
    grid-template-columns: 1fr;
  }
}
</style>
