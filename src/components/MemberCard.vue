<template>
  <NuxtLink :to="memberLink" class="member-card">
    <div class="member-card__image-wrapper">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="member.name"
        class="member-card__image"
        loading="lazy"
      />
      <div class="member-card__overlay">
        <a
          v-if="member.email"
          :href="`mailto:${member.email}`"
          class="member-card__action"
          :aria-label="t('members.sendEmail')"
          @click.stop
        >
          <Mail class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="3.6" />
        </a>
        <a
          v-if="member.scholar"
          :href="member.scholar"
          target="_blank"
          rel="noopener"
          class="member-card__action"
          :aria-label="t('members.googleScholar')"
          @click.stop
        >
          <Google class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.5" />
        </a>
        <a
          v-if="member.orcid"
          :href="`https://orcid.org/${member.orcid}`"
          target="_blank"
          rel="noopener"
          class="member-card__action"
          :aria-label="t('members.orcid')"
          @click.stop
        >
          <Orcid class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.5" />
        </a>
      </div>
    </div>
    <div class="member-card__content">
      <h3 class="member-card__name">{{ member.name }}</h3>
      <p class="member-card__role">{{ member.role || member.title }}</p>
      <p v-if="member.interests && member.interests.length" class="member-card__interests">
        {{ formattedInterests }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Mail from '@icon-park/vue-next/es/icons/Mail'
import Google from '@icon-park/vue-next/es/icons/Google'
import Orcid from '@icon-park/vue-next/es/icons/IdCardH'

interface Member {
  name: string
  role?: string
  title?: string
  email?: string
  scholar?: string
  orcid?: string
  image?: string
  interests?: string[]
  category?: string
  order?: number
  _path?: string   // Nuxt Content route path (e.g., "/members/staff/salman-ijaz")
  _id?: string     // Nuxt Content internal ID (e.g., "content:members:staff:salman-ijaz.md")
}

interface Props {
  member: Member
}

const props = defineProps<Props>()

const { t } = useI18n()
const config = useRuntimeConfig()

const imageUrl = computed(() => {
  const resolved = resolveContentImage(props.member.image, props.member._id)
  if (!resolved) return ''

  const basePath = config.app.baseURL || ''
  if (!basePath || basePath === '/') return resolved
  // Pass absolute URLs through; otherwise strip the base's trailing slash so
  // base + '/_markuxt/...' doesn't produce '//_markuxt/...'.
  if (/^(https?:)?\/\//.test(resolved) || resolved.startsWith('data:')) return resolved
  return basePath.replace(/\/+$/, '') + resolved
})

const formattedInterests = computed(() => {
  if (!props.member.interests) return ''
  return props.member.interests.slice(0, 3).join(' · ')
})

// Generate link to member detail page
const memberLink = computed(() => {
  if (props.member._path) {
    // _path is like "/members/staff/salman-ijaz"
    // Use it directly as route
    return props.member._path
  }
  // Fallback: generate from name with /members/ prefix
  return `/members/${props.member.name?.toLowerCase().replace(/\s+/g, '-') || ''}`
})
</script>

<style scoped>
.member-card {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
  text-decoration: none;
  display: block;
}

.member-card:hover {
  transform: translateY(-8px) rotate(1deg);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-secondary);
}

.member-card__image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
}

.member-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  transition: transform var(--transition-slow);
}

.member-card:hover .member-card__image {
  transform: scale(1.05);
}

.member-card__overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-md);
  background: linear-gradient(transparent, var(--surface-media-overlay));
  display: flex;
  gap: var(--spacing-sm);
  opacity: 0;
  transform: translateY(100%);
  transition: all var(--transition-base);
}

.member-card:hover .member-card__overlay {
  opacity: 1;
  transform: translateY(0);
}

.member-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--surface-raised);
  border-radius: var(--radius-full);
  color: var(--color-primary);
  transition: all var(--transition-fast);
}

.member-card__action:hover {
  background: var(--color-accent);
  color: var(--color-on-accent);
  transform: scale(1.1);
}

.member-card__content {
  padding: var(--spacing-lg);
}

.member-card__name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.3;
}

.member-card__role {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-secondary);
  margin-bottom: var(--spacing-sm);
}

.member-card__interests {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>
