<template>
  <main class="member-profile-page" v-if="member">
    <!-- Decorative background -->
    <div class="member-profile__bg">
      <div class="member-profile__pattern"></div>
      <div class="member-profile__shapes">
        <span class="member-profile__shape member-profile__shape--1"></span>
        <span class="member-profile__shape member-profile__shape--2"></span>
      </div>
    </div>

    <div class="container profile-page__container">
      <!-- Back button -->
      <NuxtLink to="/members" class="member-profile__back">
        <ArrowLeft class="icon-inline" theme="outline" :size="16" fill="currentColor" :stroke-width="2" />
        {{ t('members.backTo') }}
      </NuxtLink>

      <!-- Profile Header -->
      <div class="profile-header animate-fade-in-up">
        <div class="profile-header__image-wrapper">
          <div class="profile-header__image-inner">
            <img
              v-if="memberImage"
              :src="memberImage"
              :alt="member.name"
              class="profile-header__image"
            />
            <div class="profile-header__actions">
              <a v-if="member.email" :href="`mailto:${member.email}`" class="profile-header__action" :aria-label="t('members.email')">                <Mail class="icon-inline" theme="outline" :size="18" fill="currentColor" :stroke-width="3" />
              </a>
              <a v-if="member.scholar" :href="member.scholar" target="_blank" rel="noopener" class="profile-header__action" :aria-label="t('members.googleScholar')">
                <Google class="icon-inline" theme="outline" :size="18" fill="currentColor" :stroke-width="2.5" />
              </a>
            </div>
          </div>
        </div>

        <div class="profile-header__info">
          <span class="profile-header__badge">{{ categoryName(member.category) }}</span>
          <h1 class="profile-header__name">{{ member.name }}</h1>
          <p class="profile-header__title">{{ member.title || member.role }}</p>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="profile-content">
        <!-- Research Interests -->
        <div v-if="member.interests && member.interests.length" class="profile-section animate-fade-in-up delay-200">
          <div class="profile-section__header">
            <Search class="icon-inline" theme="outline" :size="22" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('members.researchFocus') }}</h3>
          </div>
          <div class="profile-section__body">
            <div class="interest-tags">
              <span v-for="interest in member.interests" :key="interest" class="interest-tag">
                {{ interest }}
              </span>
            </div>
          </div>
        </div>

        <!-- About/Bio with Markdown Content -->
        <div v-if="member.body || (member.content && member.content.length > 0)" class="profile-section animate-fade-in-up delay-300">
          <div class="profile-section__header">
            <FileStaff class="icon-inline" theme="outline" :size="22" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('members.about') }}</h3>
          </div>
          <div class="profile-section__body profile-section__body--content">
            <ContentRenderer :value="member" />
          </div>
        </div>

        <!-- Publications -->
        <div v-if="memberPublications.length > 0" class="profile-section animate-fade-in-up delay-400">
          <div class="profile-section__header">
            <FileText class="icon-inline" theme="outline" :size="22" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('members.publications') }}</h3>
          </div>
          <div class="profile-section__body">
            <div class="publications-grid">
              <NuxtLink
                v-for="pub in memberPublications"
                :key="pub._id"
                :to="pub._path"
                class="publication-card"
              >
                <div class="publication-card__content">
                  <h4 class="publication-card__title">{{ pub.title }}</h4>
                  <p class="publication-card__authors">{{ formatAuthors(pub.authors) }}</p>
                  <div class="publication-card__meta">
                    <span class="publication-card__venue">{{ pub.venue }}</span>
                    <span class="publication-card__year">{{ pub.year }}</span>
                  </div>
                </div>
                <ArrowRight class="publication-card__arrow" theme="outline" :size="16" fill="currentColor" :stroke-width="2" />
              </NuxtLink>
            </div>
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
        <h1>{{ t('members.notFound') }}</h1>
        <p>{{ t('members.notFoundDesc') }}</p>
        <NuxtLink to="/members" class="btn btn-primary">{{ t('members.browseAll') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArrowLeft from '@icon-park/vue-next/es/icons/ArrowLeft'
import Mail from '@icon-park/vue-next/es/icons/Mail'
import Google from '@icon-park/vue-next/es/icons/Google'
import Search from '@icon-park/vue-next/es/icons/Search'
import FileStaff from '@icon-park/vue-next/es/icons/FileStaff'
import FileText from '@icon-park/vue-next/es/icons/FileText'
import ArrowRight from '@icon-park/vue-next/es/icons/ArrowRight'
import Help from '@icon-park/vue-next/es/icons/Help'

const { t } = useI18n()
const { categoryName } = useMemberCategories()
const route = useRoute()
const config = useRuntimeConfig()

// Get member by file path
// For catch-all route [...slug], params.slug is an array like ['staff', 'salman-ijaz']
const slug = computed(() => {
  const slugParam = route.params.slug
  return Array.isArray(slugParam) ? slugParam.join('/') : slugParam
})

const { data: memberData } = await useAsyncData(`member-${slug.value}`, async () => {
  try {
    const fullPath = `/members/${slug.value}`
    return await queryContent(fullPath).where({ _extension: 'md' }).findOne()
  } catch (e) {
    console.error('Error fetching member:', e)
    return null
  }
}, {
  watch: [slug]
})

const member = computed(() => memberData.value)

// Fetch all publications for filtering by member ORCID
const { data: allPublications } = await useAsyncData('publications', async () => {
  try {
    return await queryContent('/publications')
      .where({ _hidden: { $ne: true } })
      .find()
  } catch (e) {
    console.error('Error fetching publications:', e)
    return []
  }
})

// Filter publications by member's ORCID
const memberPublications = computed(() => {
  if (!member.value?.orcid || !allPublications.value) return []

  const memberOrcid = member.value.orcid.trim()

  return (allPublications.value || [])
    .filter(pub => {
      const authorsOrcid = pub.authors_orcid
      if (!Array.isArray(authorsOrcid)) return false
      return authorsOrcid.some(orcid => orcid === memberOrcid)
    })
    .sort((a, b) => (b.year || 0) - (a.year || 0)) // Sort by year descending
})

// Format authors list for display
const formatAuthors = (authors: string[] | undefined) => {
  if (!Array.isArray(authors) || authors.length === 0) return ''
  if (authors.length <= 2) return authors.join(' & ')
  return `${authors[0]} et al.`
}

// Provide content ID for ProseImg/ProseVideo to resolve relative asset paths
provide('contentId', computed(() => member.value?._id || ''))

const memberImage = computed(() => {
  const resolved = resolveContentImage(member.value?.image, member.value?._id)
  if (!resolved) return ''
  const basePath = (config.app as { baseURL?: string }).baseURL || ''
  if (!basePath || basePath === '/') return resolved
  // Pass absolute/data URLs through; otherwise strip the base's trailing slash
  // so base + '/_markuxt/...' doesn't produce '//_markuxt/...'.
  if (/^(https?:)?\/\//.test(resolved) || resolved.startsWith('data:')) return resolved
  return basePath.replace(/\/+$/, '') + resolved
})

useHead({
  title: computed(() => member.value ? `${member.value.name} - ${t('site.shortName')}` : 'Member Not Found'),
  meta: computed(() => {
    const description = member.value?.body || member.value?.content
      ? (typeof (member.value.body || member.value.content) === 'string'
          ? (member.value.body || member.value.content).substring(0, 160).replace(/<[^>]*>/g, '')
          : `${t('site.shortName')} member`)
      : `${t('site.shortName')} member page`
    return [
      { name: 'description', content: description }
    ]
  })
})
</script>

<style scoped>
.member-profile-page {
  min-height: 100vh;
  position: relative;
}

/* Page Container with top padding for fixed header */
.profile-page__container {
  padding-top: 100px;
}

/* Background */
.member-profile__bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
  z-index: -2;
  pointer-events: none;
}

.member-profile__pattern {
  position: absolute;
  inset: 0;
  background-image: var(--page-grid-pattern-strong);
  background-size: 40px 40px;
}

.member-profile__shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.member-profile__shape {
  position: absolute;
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.member-profile__shape--1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 8%;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  opacity: 0.12;
  animation-delay: 0s;
}

.member-profile__shape--2 {
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
.member-profile__back {
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

.member-profile__back:hover {
  background: var(--surface-brand);
  border-color: var(--surface-brand);
  color: var(--color-on-brand);
  transform: translateX(-3px);
}

/* Profile Header */
.profile-header {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: var(--spacing-2xl);
  align-items: center;
  margin-bottom: var(--spacing-3xl);
}

.profile-header__image-wrapper {
  position: relative;
}

.profile-header__image-inner {
  position: relative;
  width: 180px;
  height: auto;
  max-width: 180px;
  max-height: 240px;
}

.profile-header__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center top;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.profile-header__actions {
  position: absolute;
  bottom: 15px;
  right: 10px;
  display: flex;
  gap: var(--spacing-xs);
}

.profile-header__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--surface-raised);
  border-radius: var(--radius-full);
  color: var(--color-primary);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.profile-header__action:hover {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  color: var(--color-on-accent);
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
}

.profile-header__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.profile-header__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-on-accent);
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  border-radius: var(--radius-sm);
  box-shadow: var(--accent-shadow-soft);
}

.profile-header__name {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--color-primary);
  margin: 0;
}

.profile-header__title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

/* Content Area */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
}

/* Profile Sections */
.profile-section {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all var(--transition-base);
}

.profile-section:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-secondary);
}

.profile-section__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-on-brand);
}

.profile-section__icon {
  width: 22px;
  height: 22px;
  color: var(--color-accent);
}

.profile-section__header h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: inherit;
  margin: 0;
}

.profile-section__body {
  padding: var(--spacing-xl);
}

.profile-section__body--content {
  padding: var(--spacing-xl);
  background: var(--surface-raised);
}

/* Interest Tags */
.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.interest-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.interest-tag:hover {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-on-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* Publications Grid */
.publications-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.publication-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-base);
}

.publication-card:hover {
  background: var(--color-bg-alt);
  border-color: var(--color-secondary);
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.publication-card__content {
  flex: 1;
  min-width: 0;
}

.publication-card__title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.publication-card__authors {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.4;
}

.publication-card__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.publication-card__venue {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-secondary);
}

.publication-card__year {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  background: var(--accent-soft);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.publication-card__arrow {
  flex-shrink: 0;
  color: var(--color-secondary);
  transition: transform var(--transition-fast);
}

.publication-card:hover .publication-card__arrow {
  transform: translateX(4px);
  color: var(--color-accent);
}

/* ContentRenderer Markdown Styling */
.profile-section__body--content :deep(h2) {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.profile-section__body--content :deep(h3) {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.profile-section__body--content :deep(p) {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.profile-section__body--content :deep(ul) {
  list-style: none;
  padding-left: 0;
}

.profile-section__body--content :deep(li) {
  padding-left: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  position: relative;
}

.profile-section__body--content :deep(li::before) {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: 700;
}

.profile-section__body--content :deep(a) {
  color: var(--color-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.profile-section__body--content :deep(a:hover) {
  color: var(--color-accent);
}

.profile-section__body--content :deep(strong) {
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

/* Responsive */
@media (max-width: 768px) {
  .profile-header {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .profile-header__image-wrapper {
    margin: 0 auto;
  }

  .profile-header__actions {
    right: 50%;
    transform: translateX(50%);
  }

  .profile-content {
    gap: var(--spacing-lg);
  }
}
</style>
