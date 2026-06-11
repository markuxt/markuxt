/**
 * Smart locale detection — only when the i18n cookie is NOT set,
 * check Accept-Language for a matching locale and set the cookie.
 *
 * Priority: cookie > Accept-Language > defaultLocale
 * Once the user has a cookie (even if it's the default), it is never overridden.
 *
 * Runs as Nitro middleware BEFORE @nuxtjs/i18n reads the cookie.
 * Supported locales and default locale are read from the i18n runtime config
 * — no hardcoded locale lists.
 */

import { defineEventHandler, getCookie, setCookie, getRequestHeader } from 'h3'

interface I18nPublicConfig {
  defaultLocale?: string
  locales?: string[] | Array<{ code: string; [key: string]: unknown }>
  [key: string]: unknown
}

/**
 * Parse Accept-Language header into an ordered list of locale codes.
 * "zh-CN,zh;q=0.9,en;q=0.8" → ["zh-CN", "zh", "en"]
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map(entry => entry.split(';')[0].trim())
    .filter(Boolean)
}

/** Extract locale code strings from the i18n config (string[] or object[]). */
function extractLocaleCodes(locales: I18nPublicConfig['locales']): string[] {
  if (!locales) return []
  return locales.map(l => typeof l === 'string' ? l : l.code)
}

/**
 * Find the first Accept-Language entry that matches a supported locale.
 * Matches by exact code or by language prefix (e.g. "zh" → "zh-CN").
 */
function findPreferredLocale(
  acceptLanguages: string[],
  supportedCodes: string[],
  defaultLocale: string,
): string | undefined {
  for (const lang of acceptLanguages) {
    const lower = lang.toLowerCase()
    // Exact match (e.g. "zh-CN" → "zh-CN")
    const exact = supportedCodes.find(s => s.toLowerCase() === lower)
    if (exact) return exact
    // Prefix match (e.g. "zh" → "zh-CN")
    const prefix = supportedCodes.find(
      s => s.toLowerCase().split('-')[0] === lower.split('-')[0],
    )
    if (prefix) return prefix
  }
  return defaultLocale
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const i18n = config.public?.i18n as I18nPublicConfig | undefined
  if (!i18n) return

  const defaultLocale = i18n.defaultLocale
  if (!defaultLocale) return

  const supportedCodes = extractLocaleCodes(i18n.locales)
  if (!supportedCodes.length) return

  const cookie = getCookie(event, 'i18n_locale')

  // Cookie takes priority — if a locale cookie exists, never override it.
  // Only fall back to Accept-Language when no cookie has been set yet.
  if (cookie) return

  const acceptHeader = getRequestHeader(event, 'accept-language')
  if (!acceptHeader) return

  const acceptLanguages = parseAcceptLanguage(acceptHeader)
  if (!acceptLanguages.length) return

  // Find the first matching locale in Accept-Language
  const match = findPreferredLocale(acceptLanguages, supportedCodes, defaultLocale)

  // Update cookie only if the match differs from the default
  if (match && match !== defaultLocale) {
    setCookie(event, 'i18n_locale', match, {
      path: '/',
      maxAge: 365 * 24 * 3600,
      sameSite: 'lax',
    })
  }
})
