/**
 * Reveal the page after i18n has resolved the saved locale during hydration.
 *
 * Paired with the inline <head> script in nuxt.config.ts that hides the
 * document (visibility: hidden) when the user's saved locale (i18n_locale
 * cookie) differs from the statically-prerendered default locale. That hides
 * the flash of the default language (and the layout reflow that shifts the
 * language switcher) until the correct locale is applied.
 *
 * i18n reads the cookie synchronously during hydration (locale messages are
 * bundled, not lazy-loaded), so the correct locale is set before the app
 * mounts — revealing here is safe.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const reveal = () => {
    document.documentElement.style.visibility = ''
  }

  nuxtApp.hook('app:mounted', reveal)
})
