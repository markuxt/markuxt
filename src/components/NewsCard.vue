<template>
  <article class="news-card">
    <time class="news-card__date" :datetime="news.date">
      {{ formattedDate }}
    </time>
    <NuxtLink :to="news._path" class="news-card__link">
      <h3 class="news-card__title">{{ news.title }}</h3>
    </NuxtLink>
    <p class="news-card__excerpt" v-if="news.description">
      {{ news.description }}
    </p>
    <div class="news-card__tags" v-if="news.tags && news.tags.length">
      <span v-for="tag in news.tags.slice(0, 3)" :key="tag" class="news-card__tag">
        {{ tag }}
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
// Accept any Nuxt content properties
interface NewsItem {
  title?: string
  date?: string
  description?: string
  tags?: string[]
  _path?: string
  key?: string
}

interface Props {
  news: NewsItem
}

const props = defineProps<Props>()

const { locale } = useI18n()

const formattedDate = computed(() => {
  const date = props.news.date ? new Date(props.news.date) : new Date()
  return date.toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})
</script>

<style scoped>
.news-card {
  background: var(--color-bg-alt);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.news-card:hover {
  border-color: var(--color-secondary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.news-card__date {
  font-family: var(--font-display);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.news-card__link {
  text-decoration: none;
}

.news-card__title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-primary);
  margin: 0;
  transition: color var(--transition-fast);
}

.news-card:hover .news-card__title {
  color: var(--color-secondary);
}

.news-card__excerpt {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: auto;
}

.news-card__tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
}
</style>
