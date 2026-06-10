/**
 * Ensure the i18n locale on the client matches the SSR-detected locale.
 *
 * With `no_prefix` strategy, the @nuxtjs/i18n module may not preserve the
 * SSR-detected locale through hydration. This plugin runs after the i18n
 * detection plugins and syncs the locale from the cookie as a safety net.
 */
export default defineNuxtPlugin({
  name: 'markuxt:i18n-sync',
  dependsOn: ['i18n:plugin:route-locale-detect'],
  setup() {
    const { locale, setLocale } = useI18n()
    const cookie = useCookie('i18n_locale')

    // If the cookie has a locale but the current runtime locale differs,
    // sync them. This catches cases where the SSR-detected locale was lost
    // during hydration.
    if (cookie.value && cookie.value !== locale.value) {
      setLocale(cookie.value as 'en' | 'zh-CN')
    }

    // Keep the cookie in sync when the user switches language via the selector.
    watch(locale, (newLocale) => {
      if (cookie.value !== newLocale) {
        cookie.value = newLocale
      }
    })
  },
})
