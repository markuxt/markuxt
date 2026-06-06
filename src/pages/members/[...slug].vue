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
          <span class="profile-header__badge">{{ member.category || t('members.teamMember') }}</span>
          <h1 class="profile-header__name">{{ member.name }}</h1>
          <p class="profile-header__title">{{ member.title || member.role }}</p>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="profile-content">
        <!-- Research Interests -->
        <div v-if="member.interests && member.interests.length" class="profile-section animate-fade-in-up delay-200">
          <div class="profile-section__header">
            <Search class="icon-inline" theme="outline" :size="22" fill="white" :stroke-width="2.8" />
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
            <FileStaff class="icon-inline" theme="outline" :size="22" fill="white" :stroke-width="2.8" />
            <h3>{{ t('members.about') }}</h3>
          </div>
          <div class="profile-section__body profile-section__body--content">
            <ContentRenderer :value="member" />
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
import Help from '@icon-park/vue-next/es/icons/Help'

const { t } = useI18n()
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
    return await queryContent(fullPath).findOne()
  } catch (e) {
    console.error('Error fetching member:', e)
    return null
  }
}, {
  watch: [slug]
})

const member = computed(() => memberData.value)

// Provide content ID for ProseImg/ProseVideo to resolve relative asset paths
provide('contentId', computed(() => member.value?._id || ''))

const memberImage = computed(() => {
  const resolved = resolveContentImage(member.value?.image, member.value?._id)
  if (!resolved) return ''
  const basePath = config.app.baseURL || ''
  if (!basePath || basePath === '/') return resolved
  return basePath + resolved
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
  background-image:
    linear-gradient(rgba(10, 37, 64, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(10, 37, 64, 0.03) 1px, transparent 1px);
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
  background: var(--color-primary);
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
  background: rgba(255, 255, 255, 0.9);
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
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
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
  background: white;
  border-radius: var(--radius-full);
  color: var(--color-primary);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.profile-header__action:hover {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  color: white;
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
  color: white;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(0, 217, 255, 0.3);
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-bottom: 1px solid var(--color-border);
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
  color: white;
  margin: 0;
}

.profile-section__body {
  padding: var(--spacing-xl);
}

.profile-section__body--content {
  padding: var(--spacing-xl);
  background: white;
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
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
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
