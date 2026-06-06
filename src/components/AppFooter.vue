<template>
  <footer class="footer">
    <div class="container footer__inner">
      <!-- Brand -->
      <div class="footer__brand">
        <div class="footer__logo">
          <span class="footer__logo-text">{{ t('footer.brand') }}</span>
          <span class="footer__logo-sub">{{ t('footer.university') }}</span>
        </div>
        <p class="footer__tagline">
          {{ t('footer.tagline') }}
        </p>
      </div>

      <!-- Quick Links -->
      <div class="footer__links">
        <h4 class="footer__heading">{{ t('footer.quickLinks') }}</h4>
        <nav class="footer__nav">
          <NuxtLink to="/members" class="footer__link">{{ t('nav.members') }}</NuxtLink>
          <NuxtLink to="/publications" class="footer__link">{{ t('nav.publications') }}</NuxtLink>
          <NuxtLink to="/projects" class="footer__link">{{ t('nav.projects') }}</NuxtLink>
          <NuxtLink to="/positions" class="footer__link">{{ t('nav.positions') }}</NuxtLink>
          <NuxtLink to="/news" class="footer__link">{{ t('nav.news') }}</NuxtLink>
        </nav>
      </div>

      <!-- Contact -->
      <div class="footer__contact">
        <h4 class="footer__heading">{{ t('footer.contact') }}</h4>
        <address class="footer__address">
          <p>
            <strong>{{ t('footer.director') }}</strong><br>
            {{ t('footer.directorTitle') }}<br>
            {{ t('footer.department') }}
          </p>
          <p v-if="contactEmail">
            <a :href="`mailto:${contactEmail}`" class="footer__email">
              {{ contactEmail }}
            </a>
          </p>
        </address>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <p class="footer__copyright">
          &copy; {{ currentYear }} {{ t('footer.copyright') }}
        </p>
        <div class="footer__external" v-if="externalUrl">
          <a :href="externalUrl" target="_blank" rel="noopener" class="footer__external-link">
            {{ t(appConfig.markuxt?.contact?.externalLabelKey || 'footer.universityLink') }}
            <LinkOut class="icon-inline" theme="outline" :size="12" fill="currentColor" :stroke-width="2" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import LinkOut from '@icon-park/vue-next/lib/icons/LinkOut'

const { t } = useI18n()
const appConfig = useAppConfig()
const currentYear = new Date().getFullYear()

const contactEmail = computed(() => appConfig.markuxt?.contact?.email || '')
const externalUrl = computed(() => appConfig.markuxt?.contact?.externalUrl || '')
</script>

<style scoped>
.footer {
  background: var(--color-primary);
  color: white;
  padding-top: var(--spacing-3xl);
  padding-bottom: var(--spacing-lg);
}

.footer__inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--spacing-2xl);
}

/* Brand */
.footer__brand {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.footer__logo {
  display: flex;
  flex-direction: column;
}

.footer__logo-text {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.footer__logo-sub {
  font-size: 0.875rem;
  opacity: 0.8;
  font-weight: 400;
}

.footer__tagline {
  font-size: 0.9375rem;
  line-height: 1.6;
  opacity: 0.7;
  max-width: 300px;
  margin: 0;
}

/* Links */
.footer__heading {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-accent);
  margin-bottom: var(--spacing-md);
}

.footer__nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer__link {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__link:hover {
  color: var(--color-accent);
}

/* Contact */
.footer__address {
  font-style: normal;
  font-size: 0.9375rem;
  line-height: 1.6;
  opacity: 0.8;
}

.footer__address p {
  margin-bottom: var(--spacing-sm);
}

.footer__email {
  color: var(--color-accent);
  text-decoration: none;
}

.footer__email:hover {
  text-decoration: underline;
}

/* Bottom Bar */
.footer__bottom {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer__bottom-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer__copyright {
  font-size: 0.875rem;
  opacity: 0.6;
  margin: 0;
}

.footer__external-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__external-link:hover {
  color: var(--color-accent);
}

/* Responsive */
@media (max-width: 768px) {
  .footer {
    padding-top: var(--spacing-2xl);
  }

  .footer__inner {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }

  .footer__bottom-inner {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
}
</style>
