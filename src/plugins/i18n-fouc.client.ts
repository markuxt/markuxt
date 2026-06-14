/**
 * Reveal the page after i18n has applied the saved locale AND Vue has rendered
 * it to the DOM — and make sure that locale is actually applied on static
 * hosting.
 *
 * Paired with the inline <head> script in nuxt.config.ts that hides the
 * document (visibility: hidden) when the user's saved locale (i18n_locale
 * cookie) differs from the statically-prerendered default.
 *
 * Two responsibilities, both client-only:
 *
 * 1. FORCE THE LOCALE. With `strategy: 'no_prefix'` the i18n module compiles
 *    `__I18N_ROUTING__` to false, so its `ssg-detect` plugin bails out and the
 *    client-side locale detection is unreliable — the reactive locale ref can
 *    stay at the prerendered default ('en') while the saved locale is zh-CN,
 *    leaving the language switcher pinned to the English state (and clicking
 *    the saved locale looks like a no-op). We force the reactive locale to the
 *    saved value so the switcher and every `useI18n()` consumer agree.
 *
 * 2. REVEAL. Reveal only once the locale has actually reached the saved value,
 *    deferred to nextTick so Vue has patched the DOM first.
 *
 * All `$i18n` access happens inside the `app:mounted` hook (by which point the
 * i18n plugin has resolved) and is guarded, so this utility can never break
 * app initialization.
 */
import { nextTick, watch } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const reveal = () => {
    document.documentElement.style.visibility = ''
  }

  // Read the saved locale the same way the inline head script does.
  const match = document.cookie.match(/(?:^|; )i18n_locale=([^;]+)/)
  const target = match ? decodeURIComponent(match[1]) : ''
  const prerendered = document.documentElement.lang || ''

  // No locale mismatch → nothing was hidden; clear defensively on mount.
  if (!target || target === prerendered) {
    nuxtApp.hook('app:mounted', reveal)
    return
  }

  nuxtApp.hook('app:mounted', async () => {
    const i18n = nuxtApp.$i18n as
      | { locale: { value: string }; setLocale?: (locale: string) => Promise<void> }
      | undefined

    if (!i18n?.locale) {
      reveal()
      return
    }

    // Force the reactive locale to the saved value (loads messages, fires the
    // switch hooks). Fall back to setting the ref directly if the high-level
    // switch no-ops or throws.
    if (i18n.locale.value !== target) {
      console.info(`[markuxt-i18n] cookie="${target}" current="${i18n.locale.value}" → switching`)
      try {
        await i18n.setLocale?.(target)
      } catch (error) {
        console.warn('[markuxt-i18n] setLocale failed, setting ref directly', error)
      }
      if (i18n.locale.value !== target) {
        i18n.locale.value = target
      }
    }

    // Reveal once Vue has rendered the target locale.
    if (i18n.locale.value === target) {
      nextTick(reveal)
    } else {
      const stop = watch(
        () => i18n.locale.value,
        (val) => {
          if (val === target) {
            nextTick(() => {
              reveal()
              stop()
            })
          }
        },
      )
    }
  })

  // Safety net: never leave the page hidden forever.
  nuxtApp.hook('app:mounted', () => {
    setTimeout(reveal, 500)
  })
})
