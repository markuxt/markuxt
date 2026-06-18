<template>
  <div class="news-post-page">
    <!-- Back Button -->
    <div class="container">
      <NuxtLink to="/news" class="back-link">
        {{ t('news.backTo') }}
      </NuxtLink>
    </div>

    <article class="news-post" v-if="news">
      <header class="news-post__header">
        <div class="container">
          <time class="news-post__date" :datetime="news.date">
            {{ formattedDate }}
          </time>
          <h1 class="news-post__title">{{ news.title }}</h1>
          <div class="news-post__tags" v-if="news.tags && news.tags.length">
            <span v-for="tag in news.tags" :key="tag" class="badge">
              {{ tag }}
            </span>
          </div>
        </div>
      </header>

      <div class="news-post__content">
        <div class="container">
          <ContentRenderer :value="news" />
        </div>
      </div>
    </article>

    <!-- Related News -->
    <div class="section" v-if="news && relatedNews.length > 0">
      <div class="container">
        <h3 class="related-news__title">{{ t('news.related') }}</h3>
        <div class="related-news__grid">
          <NewsCard
            v-for="item in relatedNews"
            :key="item._path"
            :news="item"
          />
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-if="!news" class="not-found-page">
      <div class="container">
        <div class="not-found">
          <Help class="icon-inline" theme="outline" :size="80" fill="var(--color-accent)" :stroke-width="3" />
          <h1>{{ t('news.notFound') }}</h1>
          <p>{{ t('news.notFoundDesc') }}</p>
          <NuxtLink to="/news" class="btn btn-primary">{{ t('news.browseAll') }}</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Help from '@icon-park/vue-next/es/icons/Help'

const { t, locale } = useI18n()
const route = useRoute()

// Compute slug to support catch-all route [...slug] (array or string)
const slug = computed(() => {
  const slugParam = route.params.slug
  return Array.isArray(slugParam) ? slugParam.join('/') : slugParam
})

// Fetch current news post (watch slug for navigation)
const { data: news } = await useAsyncData(() => `news-${slug.value}`, async () => {
  try {
    const fullPath = `/news/${slug.value}`
    return await queryContent(fullPath).where({ _extension: 'md' }).findOne()
  } catch (e) {
    console.error('Error fetching news:', e)
    return null
  }
}, { watch: [slug] })

// Provide content ID for ProseImg/ProseVideo to resolve relative asset paths
provide('contentId', computed(() => news.value?._id || ''))

// Fetch related news (exclude current)
const { data: allNews } = await useAsyncData('news-related', () =>
  queryContent('/news')
    .where({ _hidden: { $ne: true } })
    .sort({ date: -1 })
    .limit(6)
    .where({ _extension: 'md' }).find()
)

const relatedNews = computed(() => {
  if (!allNews.value || !news.value) return []
  const currentPath = news.value._path
  return allNews.value
    .filter(item => item._path !== currentPath)
    .slice(0, 3)
})

const formattedDate = computed(() => {
  if (!news.value?.date) return ''
  const date = new Date(news.value.date)
  return date.toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// SEO
useHead({
  title: computed(() => news.value ? news.value.title : 'News Post Not Found'),
  meta: computed(() => [
    { name: 'description', content: news.value?.description || `News post from ${t('site.shortName')}.` }
  ])
})
</script>

<style scoped>
.news-post-page {
  min-height: 100vh;
}

.back-link {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-sm) 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-secondary);
}

/* News Post */
.news-post {
  margin-bottom: var(--spacing-3xl);
}

.news-post__header {
  padding: var(--spacing-3xl) 0 var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.news-post__date {
  display: block;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-md);
}

.news-post__title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  line-height: 1.2;
}

.news-post__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.news-post__content {
  padding: var(--spacing-2xl) 0;
}

.news-post__content :deep(p) {
  font-size: 1.0625rem;
  line-height: 1.7;
  margin-bottom: var(--spacing-md);
}

.news-post__content :deep(h2) {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-md);
}

.news-post__content :deep(h3) {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-sm);
}

.news-post__content :deep(ul),
.news-post__content :deep(ol) {
  margin-bottom: var(--spacing-md);
  padding-left: var(--spacing-xl);
}

.news-post__content :deep(li) {
  margin-bottom: var(--spacing-xs);
  line-height: 1.6;
}

/* Related News */
.related-news__title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
}

.related-news__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

@media (max-width: 640px) {
  .related-news__grid {
    grid-template-columns: 1fr;
  }
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

.not-found__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-accent);
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  border-radius: var(--radius-xl);
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
</style>
