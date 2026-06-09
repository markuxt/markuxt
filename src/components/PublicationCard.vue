<template>
  <article class="publication-card">
    <div class="publication-card__meta">
      <span class="publication-card__year">{{ publication.year }}</span>
      <span v-if="publication.venue" class="badge badge-accent">{{ publication.venue }}</span>
    </div>
    <h3 class="publication-card__title">
      <!-- If there's a detail page (_path), link to it; otherwise show plain title or DOI link -->
      <NuxtLink v-if="publication._path" :to="publication._path" class="publication-card__title-link">
        {{ publication.title }}
      </NuxtLink>
      <a v-else-if="publication.doi" :href="publication.doi" target="_blank" rel="noopener" class="publication-card__title-link">
        {{ publication.title }}
      </a>
      <span v-else class="publication-card__title-text">{{ publication.title }}</span>
    </h3>
    <p class="publication-card__authors">{{ formattedAuthors }}</p>
    <p class="publication-card__abstract" v-if="publication.abstract">{{ truncatedAbstract }}</p>
    <div class="publication-card__footer">
      <div class="publication-card__keywords">
        <span
          v-for="(keyword, index) in displayedKeywords"
          :key="index"
          class="publication-card__keyword"
        >
          {{ keyword }}
        </span>
        <span v-if="moreKeywords" class="publication-card__keyword-more">+{{ moreKeywords }}</span>
      </div>
      <!-- Only show DOI link if there's NO detail page -->
      <a
        v-if="publication.doi && !publication._path"
        :href="publication.doi"
        target="_blank"
        rel="noopener"
        class="publication-card__link"
        :aria-label="t('publications.viewPublication')"
      >
        <LinkOut class="icon-inline" theme="outline" :size="16" fill="currentColor" :stroke-width="2" />
      </a>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LinkOut from '@icon-park/vue-next/es/icons/LinkOut'

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

interface Props {
  publication: Publication
}

const props = defineProps<Props>()

const { t } = useI18n()

const formattedAuthors = computed(() => {
  const authors = props.publication.authors
  if (authors.length <= 2) return authors.join(t('publications.authorSep'))
  return authors.slice(0, authors.length - 1).join(', ') + ', ' + t('publications.authorSep') + authors[authors.length - 1]
})

const truncatedAbstract = computed(() => {
  if (!props.publication.abstract) return ''
  const abstract = props.publication.abstract
  return abstract.length > 200 ? abstract.slice(0, 200) + t('publications.truncation') : abstract
})

const displayedKeywords = computed(() => {
  if (!props.publication.keywords) return []
  return props.publication.keywords.slice(0, 3)
})

const moreKeywords = computed(() => {
  if (!props.publication.keywords) return 0
  const remaining = props.publication.keywords.length - 3
  return remaining > 0 ? t('publications.moreKeywords', { n: remaining }) : ''
})
</script>

<style scoped>
.publication-card {
  background: var(--color-bg-alt);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
  display: block;
  text-decoration: none;
}

.publication-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-secondary);
  transform: translateY(-4px);
}

.publication-card__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.publication-card__year {
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

.publication-card__title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.publication-card__title-link {
  color: var(--color-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
  display: block;
}

.publication-card__title-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.publication-card__title-text {
  color: var(--color-primary);
}

.publication-card__authors {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
}

.publication-card__abstract {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--color-text);
  line-height: 1.6;
}

.publication-card__footer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.publication-card__keywords {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.publication-card__keyword {
  display: inline-flex;
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.publication-card__keyword:hover {
  background: var(--color-secondary);
  color: var(--color-on-secondary);
}

.publication-card__keyword-more {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.publication-card__keyword-more:hover {
  background: var(--color-secondary);
  color: var(--color-on-secondary);
}

.publication-card__link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-bg-alt);
  border-radius: var(--radius-full);
  color: var(--color-primary);
  transition: all var(--transition-fast);
}

.publication-card__link:hover {
  background: var(--color-secondary);
  color: var(--color-on-secondary);
  transform: scale(1.1);
}
</style>
