<template>
  <header class="header" :class="{ 'header--scrolled': scrolled }">
    <div class="container header__inner">
      <!-- Logo -->
      <NuxtLink to="/" class="header__logo">
        <img :src="logoSrc" :alt="t('nav.universityAlt')" class="header__logo-img">
        <div class="header__logo-text">
          <span class="header__logo-main">{{ t('nav.brand') }}</span>
          <span class="header__logo-sub">{{ t('nav.university') }}</span>
        </div>
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="header__nav">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="header__link"
          :class="{ 'header__link--active': isActive(item.to) }"
        >
          {{ item.label }}
        </NuxtLink>
        <LanguageSwitcher />
      </nav>

      <!-- Mobile Menu Button -->
      <button
        class="header__toggle"
        @click="toggleMobileMenu"
        :aria-label="t('nav.toggleMenu')"
        :aria-expanded="mobileMenuOpen"
      >
        <span class="header__hamburger" :class="{ 'header__hamburger--open': mobileMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
    </div>

    <!-- Mobile Navigation -->
    <Transition name="mobile-menu">
      <nav class="header__mobile-nav" v-if="mobileMenuOpen">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="header__mobile-link"
          @click="mobileMenuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
        <LanguageSwitcher />
      </nav>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const route = useRoute()
const config = useRuntimeConfig()

const { t } = useI18n()
const appConfig = useAppConfig()

const logoSrc = computed(() => {
  const basePath = config.app.baseURL || '/'
  const base = basePath.endsWith('/') ? basePath : basePath + '/'
  const src = appConfig.markuxt?.logo?.src || ''
  return base + src.replace(/^\//, '')
})

const navigation = computed(() =>
  (appConfig.markuxt?.navigation || []).map(item => ({
    to: item.to,
    label: t(item.labelKey)
  }))
)

const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.header--scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  border-bottom-color: var(--color-border);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

/* Logo */
.header__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.header__logo:hover {
  opacity: 0.8;
}

.header__logo-img {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
}

.header__logo-text {
  display: flex;
  flex-direction: column;
}

.header__logo-main {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-primary);
}

.header__logo-sub {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--color-secondary);
  letter-spacing: 0.02em;
}

/* Desktop Navigation */
.header__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.header__link {
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  position: relative;
}

.header__link:hover {
  color: var(--color-secondary);
  background: rgba(0, 155, 193, 0.08);
}

.header__link--active {
  color: var(--color-secondary);
  font-weight: 600;
}

.header__link--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--color-secondary);
  border-radius: 1px;
}

/* Mobile Toggle */
.header__toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.header__hamburger {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header__hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.header__hamburger--open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.header__hamburger--open span:nth-child(2) {
  opacity: 0;
}

.header__hamburger--open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile Navigation */
.header__mobile-nav {
  display: none;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  background: white;
  border-top: 1px solid var(--color-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.header__mobile-nav .lang-switcher {
  margin-top: var(--spacing-md);
}

.header__mobile-link {
  padding: var(--spacing-md);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.header__mobile-link:hover,
.header__mobile-link.router-link-active {
  background: var(--color-bg);
  color: var(--color-secondary);
}

/* Mobile Menu Transition */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 1024px) {
  .header__logo-main {
    font-size: 1rem;
  }

  .header__logo-sub {
    font-size: 0.5625rem;
  }

  .header__nav {
    display: none;
  }

  .header__toggle {
    display: flex;
  }

  .header__mobile-nav {
    display: flex;
  }
}

@media (max-width: 640px) {
  .header__inner {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }

  .header__logo-main {
    font-size: 0.875rem;
  }

  .header__logo-sub {
    display: none;
  }
}
</style>
