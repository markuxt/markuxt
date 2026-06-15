<template>
  <section class="hero">
    <div class="container hero__container">
      <div class="hero__grid">
      <div class="hero__content">
        <span class="hero__badge">{{ badge || t('hero.badge') }}</span>
        <h1 class="hero__title">{{ title || t('hero.title') }}</h1>
        <p class="hero__description">{{ description || t('hero.description') }}</p>
        <div class="hero__actions">
          <NuxtLink to="/members" class="btn btn-primary">
            {{ t('hero.meetTeam') }}
          </NuxtLink>
          <NuxtLink to="/publications" class="btn btn-secondary">
            {{ t('hero.viewResearch') }}
          </NuxtLink>
        </div>
      </div>
      <div class="hero__visual">
        <!-- Image Carousel -->
        <div class="carousel">
          <div class="carousel__track" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
            <div
              v-for="(slide, index) in carouselImages"
              :key="index"
              class="carousel__slide"
            >
              <img :src="slide.src" :alt="slide.alt" class="carousel__image" />
              <div class="carousel__caption" v-if="slide.caption">
                <span>{{ slide.caption }}</span>
              </div>
            </div>
          </div>
          <!-- Navigation Dots -->
          <div class="carousel__dots" v-if="carouselImages.length > 1">
            <button
              v-for="(_, index) in carouselImages"
              :key="index"
              class="carousel__dot"
              :class="{ 'carousel__dot--active': currentSlide === index }"
              @click="goToSlide(index)"
              :aria-label="t('hero.goToSlide', { n: index + 1 })"
            ></button>
          </div>
          <!-- Navigation Arrows -->
          <button
            v-if="carouselImages.length > 1"
            class="carousel__arrow carousel__arrow--prev"
            @click="prevSlide"
            :aria-label="t('hero.prevSlide')"
          >
            <Left class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="3" />
          </button>
          <button
            v-if="carouselImages.length > 1"
            class="carousel__arrow carousel__arrow--next"
            @click="nextSlide"
            :aria-label="t('hero.nextSlide')"
          >
            <Right class="icon-inline" theme="outline" :size="20" fill="currentColor" :stroke-width="3" />
          </button>
          <!-- Progress Bar -->
          <div class="carousel__progress" v-if="carouselImages.length > 1">
            <div class="carousel__progress-bar" :style="{ width: `${((currentSlide + 1) / carouselImages.length) * 100}%` }"></div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Left from '@icon-park/vue-next/es/icons/Left'
import Right from '@icon-park/vue-next/es/icons/Right'

interface Props {
  badge?: string
  title?: string
  description?: string
}

interface CarouselImage {
  src: string
  alt: string
  caption: string
}

const { t } = useI18n()

withDefaults(defineProps<Props>(), {
  badge: '',
  title: '',
  description: ''
})

const config = useRuntimeConfig()
const appConfig = useAppConfig()

// Carousel images from app.config — synchronous, SSR-safe
const carouselImages = computed((): CarouselImage[] => {
  const images = (appConfig.markuxt as Record<string, any>)?.carousel?.images as CarouselImage[] | undefined
  const basePath = (config.app as { baseURL?: string }).baseURL || '/'
  // Strip trailing slash so base + '/images/...' doesn't produce '//images/...'.
  const base = basePath === '/' ? '' : basePath.replace(/\/+$/, '')
  // Prefix site-relative paths with the base; pass absolute URLs through unchanged.
  const withBase = (s: string) =>
    /^(https?:)?\/\//.test(s) || s.startsWith('data:') ? s : `${base}${s}`

  if (!images || images.length === 0) {
    const fallback = (appConfig.markuxt as Record<string, any>)?.carousel?.fallbackImage || '/images/logo.png'
    return [{
      src: withBase(fallback),
      alt: t('hero.placeholderAlt'),
      caption: t('hero.placeholderCaption')
    }]
  }

  return images.map(img => ({
    ...img,
    src: withBase(img.src)
  }))
})

const currentSlide = ref(0)
const autoPlayInterval = ref<ReturnType<typeof setInterval> | null>(null)
const isAutoPlaying = ref(false)

const nextSlide = () => {
  if (carouselImages.value.length === 0) return
  currentSlide.value = (currentSlide.value + 1) % carouselImages.value.length
}

const prevSlide = () => {
  if (carouselImages.value.length === 0) return
  currentSlide.value = currentSlide.value === 0 ? carouselImages.value.length - 1 : currentSlide.value - 1
}

const goToSlide = (index: number) => {
  currentSlide.value = index
  stopAutoPlay()
}

const startAutoPlay = () => {
  if (carouselImages.value.length > 1 && !isAutoPlaying.value) {
    isAutoPlaying.value = true
    autoPlayInterval.value = setInterval(() => {
      nextSlide()
    }, 5000)
  }
}

const stopAutoPlay = () => {
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
    autoPlayInterval.value = null
  }
  isAutoPlaying.value = false
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding-top: var(--header-height);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
  opacity: 0.03;
  z-index: -1;
}

.hero__container {
  padding-inline: var(--spacing-2xl);
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--spacing-3xl);
  align-items: center;
}

.hero__content {
  animation: fadeInUp 0.8s ease forwards;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  background: var(--accent-soft);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-lg);
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
}

.hero__title span {
  color: var(--color-secondary);
}

.hero__description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xl);
  max-width: 540px;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

/* Carousel */
.hero__visual {
  position: relative;
  /* 4:3 aspect ratio */
  aspect-ratio: 4 / 3;
  width: 100%;
  /* max-height: 500px; */
  animation: fadeIn 1s ease 0.3s forwards;
  opacity: 0;
}

.carousel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  background: linear-gradient(135deg, var(--surface-brand) 0%, var(--surface-brand-strong) 100%);
}

.carousel__track {
  display: flex;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel__slide {
  min-width: 100%;
  height: 100%;
  position: relative;
}

.carousel__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-lg);
  background: linear-gradient(transparent, var(--surface-overlay));
  color: var(--color-on-brand);
}

.carousel__caption span {
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.carousel__dots {
  position: absolute;
  bottom: var(--spacing-md);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-xs);
  z-index: 10;
}

.carousel__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--carousel-dot);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.carousel__dot:hover {
  background: var(--carousel-dot-hover);
}

.carousel__dot--active {
  background: var(--surface-raised);
  width: 24px;
  border-radius: var(--radius-full);
}

/* Navigation Arrows */
.carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-frosted);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  transition: all var(--transition-fast);
  z-index: 10;
}

.carousel__arrow:hover,
.carousel__arrow:focus {
  background: var(--surface-raised);
  box-shadow: var(--shadow-md);
  transform: translateY(-50%) scale(1.1);
}

.carousel__arrow--prev {
  left: var(--spacing-md);
}

.carousel__arrow--next {
  right: var(--spacing-md);
}

.carousel__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--carousel-progress-track);
}

.carousel__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-secondary));
  transition: width 0.3s ease;
}

/* Reduced motion support */
@media (prefers-reduced-motion) {
  .hero__content,
  .hero__visual,
  .carousel__track,
  .carousel__arrow {
    animation: none !important;
    transition: none !important;
  }

  .carousel__arrow:hover,
  .carousel__arrow:focus {
    transform: translateY(-50%);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    min-height: auto;
    padding-top: calc(var(--header-height) + var(--spacing-xl));
    padding-bottom: var(--spacing-2xl);
  }

  .hero__container {
    padding-inline: var(--spacing-xl);
  }

  .hero__grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
  }

  .hero__visual {
    order: -1;
    /* Keep 4:3 ratio on tablet */
    aspect-ratio: 4 / 3;
    /* max-height: 400px; */
  }
}

@media (max-width: 480px) {
  .hero {
    padding-top: calc(var(--header-height) + var(--spacing-md));
  }

  .hero__actions {
    flex-direction: column;
  }

  .hero__actions .btn {
    width: 100%;
  }

  .hero__visual {
    /* Keep 4:3 ratio on mobile */
    aspect-ratio: 4 / 3;
    max-height: 300px;
  }
}
</style>
