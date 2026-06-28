/**
 * i18n locale resolution + `?lang=` URL sync, all client-only.
 *
 * Paired with the inline <head> script in nuxt.config.ts that hides the
 * document (visibility: hidden) when the user's locale differs from the
 * statically-prerendered default.
 *
 * Locale priority: ?lang= param > cookie > defaultLocale
 * URL sync: non-default locale → ?lang=<locale>; default → no param.
 */
import { nextTick, watch } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const reveal = () => {
    document.documentElement.style.visibility = ''
  }

  // --- Read sources (at plugin setup, from DOM) ---
  const urlParams = new URLSearchParams(document.location.search)
  const langParam = urlParams.get('lang') || ''
  const cookieMatch = document.cookie.match(/(?:^|; )i18n_locale=([^;]+)/)
  const cookieLocale = cookieMatch ? decodeURIComponent(cookieMatch[1]) : ''

  // --- URL helper: sync ?lang= ---
  // Uses window.history.replaceState (confirmed to work on static hosting)
  // rather than router.replace (which can be intercepted/reverted by Vue Router).
  const syncUrl = (locale: string, def: string) => {
    const targetLang = (locale && locale !== def) ? locale : null
    const urlLang = new URLSearchParams(window.location.search).get('lang')
    if (urlLang === targetLang) return // no change

    const u = new URL(window.location.href)
    if (targetLang) {
      u.searchParams.set('lang', targetLang)
    } else {
      u.searchParams.delete('lang')
    }
    window.history.replaceState(window.history.state, '', u.pathname + u.search + (u.hash || ''))
  }

  // --- Resolve everything inside app:mounted where $i18n + config are ready ---
  nuxtApp.hook('app:mounted', async () => {
    const i18n = nuxtApp.$i18n as
      | { locale: { value: string }; locales: { value: Array<{ code: string }> }; setLocale?: (l: string) => Promise<void> }
      | undefined

    const def = (nuxtApp.$config as any)?.public?.i18n?.defaultLocale || 'en'

    if (!i18n?.locale) {
      syncUrl('', def)
      reveal()
      return
    }

    const supported = (i18n.locales?.value || []).map(l => l.code)
    const isValid = (code: string) => supported.includes(code)

    // --- Determine effective target locale ---
    // Priority:
    //   ?lang=<valid>      → that locale (even if it's the default)
    //   ?lang=<invalid>    → default (NOT cookie — explicit param overrides)
    //   ?lang= (empty)     → default
    //   no ?lang=           → cookie (if valid) > default
    let target = def
    if (langParam !== '') {
      // ?lang= is present (even if empty string after ?lang=)
      target = isValid(langParam) ? langParam : def
    } else if (cookieLocale && isValid(cookieLocale) && cookieLocale !== def) {
      target = cookieLocale
    }

    // --- Force locale to target ---
    if (i18n.locale.value !== target) {
      console.info(`[markuxt-i18n] target="${target}" current="${i18n.locale.value}" → switching`)
      try {
        await i18n.setLocale?.(target)
      } catch (e) {
        console.warn('[markuxt-i18n] setLocale failed', e)
      }
      if (i18n.locale.value !== target) {
        i18n.locale.value = target
      }
    }

    // --- Sync URL to resolved locale ---
    // Delayed: Vue Router strips ?lang= during hydration; re-add after it settles.
    syncUrl(i18n.locale.value, def)
    setTimeout(() => syncUrl(i18n.locale.value, def), 500)

    // --- Reveal ---
    if (i18n.locale.value === target) {
      nextTick(reveal)
    } else {
      const stop = watch(
        () => i18n.locale.value,
        (val) => {
          if (val === target) {
            nextTick(() => { syncUrl(val, def); reveal(); stop() })
          }
        },
      )
    }

    // --- Watch future locale changes (switcher, etc.) → sync URL ---
    watch(
      () => i18n.locale?.value,
      (locale) => { if (locale) syncUrl(locale, def) },
    )
  })

  // Safety net: never leave the page hidden forever
  nuxtApp.hook('app:mounted', () => { setTimeout(reveal, 500) })
})
