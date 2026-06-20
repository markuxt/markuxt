<template>
  <main class="publication-page" v-if="publication">
    <!-- Decorative background -->
    <div class="publication__bg">
      <div class="publication__pattern"></div>
      <div class="publication__shapes">
        <span class="publication__shape publication__shape--1"></span>
        <span class="publication__shape publication__shape--2"></span>
      </div>
    </div>

    <div class="container publication-page__container">
      <!-- Back button -->
      <NuxtLink to="/publications" class="publication__back">
        <ArrowLeft class="icon-inline" theme="outline" :size="16" fill="currentColor" :stroke-width="2" />
        {{ t('publications.backTo') }}
      </NuxtLink>

      <!-- Publication Header -->
      <div class="publication-header animate-fade-in-up">
        <div class="publication-header__meta">
          <span class="publication-header__year">{{ publication.year }}</span>
          <span v-if="publication.venue" class="badge badge-accent">{{ publication.venue }}</span>
        </div>
        <h1 class="publication-header__title">{{ publication.title }}</h1>
        <p class="publication-header__authors">{{ formattedAuthors }}</p>
      </div>

      <!-- Publication Content -->
      <div class="publication-content">
        <!-- Abstract -->
        <div v-if="hasAbstract || screenshotUrl" class="publication-section animate-fade-in-up delay-200">
          <div class="publication-section__header">
            <FileStaff class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('publications.abstract') }}</h3>
          </div>
          <div class="publication-section__body publication-section__body--content">
            <img
              v-if="screenshotUrl"
              :src="screenshotUrl"
              :alt="publication.title"
              class="publication-screenshot"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <ContentRenderer :value="publication" />
          </div>
        </div>

        <!-- Keywords -->
        <div v-if="publication.keywords && publication.keywords.length" class="publication-section animate-fade-in-up delay-300">
          <div class="publication-section__header">
            <Key class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('publications.keywords') }}</h3>
          </div>
          <div class="publication-section__body">
            <div class="keyword-tags">
              <span v-for="keyword in publication.keywords" :key="keyword" class="keyword-tag">
                {{ keyword }}
              </span>
            </div>
          </div>
        </div>

        <!-- Authors who are members of this site (matched by ORCID) -->
        <div v-if="authorMembers.length > 0" class="publication-section animate-fade-in-up delay-400">
          <div class="publication-section__header">
            <Peoples class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="2.8" />
            <h3>{{ t('publications.memberAuthors') }}</h3>
          </div>
          <div class="publication-section__body">
            <div class="publication-members-grid">
              <MemberCard
                v-for="member in authorMembers"
                :key="member._id || member.name"
                :member="member"
              />
            </div>
          </div>
        </div>

        <!-- DOI Link -->
        <div v-if="publication.doi" class="animate-fade-in-up delay-400">
          <a
            :href="publication.doi"
            target="_blank"
            rel="noopener"
            class="doi-link"
          >
            <LinkOut class="icon-inline" theme="outline" :size="18" fill="currentColor" :stroke-width="2.8" />
            {{ t('publications.viewOnPublisherSite') }}
          </a>
        </div>
      </div>
    </div>
  </main>

  <!-- Not Found -->
  <div v-else class="not-found-page">
    <div class="container">
      <div class="not-found">
        <Help class="icon-inline" theme="outline" :size="80" fill="var(--color-accent)" :stroke-width="3" />
        <h1>{{ t('publications.notFound') }}</h1>
        <p>{{ t('publications.notFoundDesc') }}</p>
        <NuxtLink to="/publications" class="btn btn-primary">{{ t('publications.browseAll') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArrowLeft from '@icon-park/vue-next/es/icons/ArrowLeft'
import FileStaff from '@icon-park/vue-next/es/icons/FileStaff'
import Key from '@icon-park/vue-next/es/icons/Key'
import LinkOut from '@icon-park/vue-next/es/icons/LinkOut'
import Peoples from '@icon-park/vue-next/es/icons/Peoples'
import Help from '@icon-park/vue-next/es/icons/Help'

const { t } = useI18n()
const route = useRoute()

// Get publication by file path
// For catch-all route [...slug], params.slug is an array like ['2022', 'sensors-sensor-fusion']
const slug = computed(() => {
  const slugParam = route.params.slug
  return Array.isArray(slugParam) ? slugParam.join('/') : slugParam
})

const { data: publicationData } = await useAsyncData(`publication-${slug.value}`, async () => {
  try {
    const fullPath = `/publications/${slug.value}`
    // Filter to markdown so a binary asset that shares the same _path as the
    // .md (e.g. an `abstract_screenshot` image sitting next to the article)
    // can't shadow the article — `findOne()` would otherwise return whichever
    // of the two sorts first by _id (.jpg < .md).
    return await queryContent(fullPath).where({ _extension: 'md' }).findOne()
  } catch (e) {
    console.error('Error fetching publication:', e)
    return null
  }
}, {
  watch: [slug]
})

const publication = computed(() => publicationData.value)

// Provide content ID for ProseImg/ProseVideo to resolve relative asset paths
provide('contentId', computed(() => publication.value?._id || ''))

const config = useRuntimeConfig()

// Resolve the abstract screenshot (a relative image filename in frontmatter,
// alongside the .md) to a /_markuxt/ URL. Empty when none is configured.
const screenshotUrl = computed(() => {
  const resolved = resolveContentImage(publication.value?.abstract_screenshot, publication.value?._id)
  if (!resolved) return ''
  const basePath = (config.app as { baseURL?: string }).baseURL || ''
  if (!basePath || basePath === '/') return resolved
  if (/^(https?:)?\/\//.test(resolved) || resolved.startsWith('data:')) return resolved
  return basePath.replace(/\/+$/, '') + resolved
})

const hasAbstract = computed(() => {
  if (publication.value?.abstract) return true
  if ((publication.value?.body?.children?.length ?? 0) > 0) return true
  return false
})

const formattedAuthors = computed(() => {
  if (!publication.value?.authors) return ''
  const authors = publication.value.authors
  if (authors.length <= 2) return authors.join(t('publications.authorSep'))
  return authors.slice(0, authors.length - 1).join(', ') + ', ' + t('publications.authorSep') + authors[authors.length - 1]
})

// A publication's `authors_orcid` is a parallel array to `authors` (one ORCID
// per author, `null` where an author has none). Fetch every site member and
// surface those whose ORCID appears here — i.e. this paper's authors who are
// also members of this site — linking back to their member pages. Matched via
// `normalizeOrcid` so a URL-form ORCID on either side still matches.
interface MemberLike {
  name: string
  _id?: string
  _path?: string
  [key: string]: any
}

const { data: allMembers } = await useAsyncData('publication-members', async () => {
  try {
    return await queryContent('/members')
      .where({ _hidden: { $ne: true } })
      .where({ _extension: 'md' })
      // Project to only the fields MemberCard + the ORCID match need, so a
      // large member base doesn't bloat every publication route's payload.
      .only(['name', 'role', 'title', 'email', 'scholar', 'orcid', 'image', 'interests', 'category', 'order', '_path', '_id'])
      .find()
  } catch (e) {
    console.error('Error fetching members:', e)
    return []
  }
})

// Members of this site who authored this publication, kept in authorship
// order (the order ORCIDs appear in `authors_orcid`) and de-duplicated so a
// repeated ORCID never renders the same member twice.
const authorMembers = computed<MemberLike[]>(() => {
  const ids = publication.value?.authors_orcid
  if (!Array.isArray(ids) || ids.length === 0) return []

  const byOrcid = new Map<string, MemberLike>()
  for (const m of (allMembers.value as MemberLike[] | null) || []) {
    const oid = normalizeOrcid(m.orcid)
    if (!oid) continue
    // Two members should never share an ORCID; if they do (data error), warn
    // in dev so it's noticed rather than silently last-wins.
    if (import.meta.dev && byOrcid.has(oid)) {
      console.warn('[markuxt] Duplicate ORCID across members — only one will be linked:', oid)
    }
    byOrcid.set(oid, m)
  }

  const seen = new Set<string>()
  const matched: MemberLike[] = []
  for (const id of ids) {
    const oid = normalizeOrcid(id)
    if (!oid || seen.has(oid)) continue
    const m = byOrcid.get(oid)
    if (m) {
      seen.add(oid)
      matched.push(m)
    }
  }
  return matched
})

useHead({
  title: computed(() => publication.value ? `${publication.value.title} - ${t('site.shortName')}` : 'Publication Not Found'),
  meta: computed(() => {
    const description = publication.value?.abstract || publication.value?.body
      ? (typeof (publication.value.abstract || publication.value.body) === 'string'
          ? (publication.value.abstract || publication.value.body).substring(0, 160).replace(/<[^>]*>/g, '')
          : `${t('site.shortName')} publication`)
      : `${t('site.shortName')} publication page`
    return [
      { name: 'description', content: description }
    ]
  })
})
</script>

<style scoped>
.publication-page {
  min-height: 100vh;
  position: relative;
}

/* Page Container with top padding for fixed header */
.publication-page__container {
  padding-top: 100px;
}

/* Background */
.publication__bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
  z-index: -2;
  pointer-events: none;
}

.publication__pattern {
  position: absolute;
  inset: 0;
  background-image: var(--page-grid-pattern-strong);
  background-size: 40px 40px;
}

.publication__shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.publication__shape {
  position: absolute;
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.publication__shape--1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 8%;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  opacity: 0.12;
  animation-delay: 0s;
}

.publication__shape--2 {
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
.publication__back {
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

.publication__back:hover {
  background: var(--surface-brand);
  border-color: var(--surface-brand);
  color: var(--color-on-brand);
  transform: translateX(-3px);
}

/* Publication Header */
.publication-header {
  margin-bottom: var(--spacing-3xl);
}

.publication-header__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.publication-header__year {
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

.publication-header__title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.publication-header__authors {
  font-size: 1rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* Content Area */
.publication-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
}

/* Publication Sections */
.publication-section {
  background: var(--color-bg-alt);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all var(--transition-base);
}

.publication-section:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-secondary);
}

.publication-section__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-on-brand);
}

.publication-section__header h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: inherit;
  margin: 0;
}

.publication-section__body {
  padding: var(--spacing-xl);
}

.publication-section__body--content {
  padding: var(--spacing-xl);
  background: var(--surface-raised);
}

.publication-screenshot {
  display: block;
  width: 100%;
  max-height: 720px;
  object-fit: contain;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  margin-bottom: var(--spacing-lg);
}

/* Keywords */
.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.keyword-tag {
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

.keyword-tag:hover {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-on-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* DOI Link */
.doi-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-secondary);
  color: var(--color-on-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: all var(--transition-base);
}

.doi-link:hover {
  background: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Authors-from-this-site grid (reuses MemberCard). Mirrors MembersGrid's
   responsive auto-fill, but without the category grouping/sorting so the
   matched authors keep their authorship order. */
.publication-members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-lg);
}

@media (max-width: 640px) {
  .publication-members-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--spacing-md);
  }
}

/* ContentRenderer Markdown Styling */
.publication-section__body--content :deep(h2) {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.publication-section__body--content :deep(p) {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
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
  .publication-content {
    gap: var(--spacing-lg);
  }
}
</style>
