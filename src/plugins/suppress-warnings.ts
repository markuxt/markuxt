/**
 * Suppress known benign Vue / Nuxt / DevTools warnings in the browser console.
 *
 * Covers:
 * – Suspense experimental:         Vue 3 core uses console.warn directly (not
 *                                  vueApp.config.warnHandler), so we patch it.
 * – Extraneous non-props attrs:    Nuxt DevTools internal VueElement component.
 * – Hydration mismatch:            Common Nuxt dev-mode SSR hydration noise
 *                                  (page transitions, HMR, etc.).
 */
const SUPPRESSED = [
  'Suspense is an experimental feature',
  'Extraneous non-props attributes',
  'Hydration',
  'hydration',
]

const originalWarn = console.warn

function shouldSuppress(msg: string) {
  return SUPPRESSED.some(p => msg.includes(p))
}

// Patch console.warn – Vue core logs the Suspense warning through console.warn
// directly (not via the warnHandler), so we must intercept it at the console level.
console.warn = (...args: any[]) => {
  const text = args.map(a => typeof a === 'string' ? a : '').join(' ')
  if (shouldSuppress(text)) return
  originalWarn.apply(console, args)
}

export default defineNuxtPlugin((nuxtApp) => {
  // Also hook into Vue's warning system for framework-generated warnings
  // (e.g. hydration mismatches go through warnHandler, not console.warn).
  nuxtApp.vueApp.config.warnHandler = (msg) => {
    const text = typeof msg === 'string' ? msg : ''
    if (shouldSuppress(text)) return
    originalWarn.apply(console, [msg])
  }
})
