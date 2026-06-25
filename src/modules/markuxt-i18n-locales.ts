import { readdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { defineNuxtModule } from '@nuxt/kit'

/**
 * Normalize a locale display name for the top-right language switcher:
 *   - convert full-width/special brackets to ASCII: （ ） → ( )
 *   - ensure exactly one space before '('
 *   - ensure no space before ')'
 * e.g. "中文（中国）" → "中文 (中国)", "português (Brasil)" → unchanged.
 */
function normalizeName(name: string): string {
    return name
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        .replace(/\s*\(/g, ' (')
        .replace(/\s+\)/g, ')')
        .trim()
}

/**
 * Detect locales from a directory of `<code>.json` files.
 * Filename (minus .json) is the locale code; the display name is resolved via
 * Intl.DisplayNames in the locale's own language, then normalized.
 */
function detectLocales(i18nDir: string) {
    if (!existsSync(i18nDir)) return []
    const files = readdirSync(i18nDir).filter(f => f.endsWith('.json')).sort()
    return files.map(f => {
        const code = f.replace(/\.json$/, '')
        let name = code
        try {
            name = new Intl.DisplayNames([code], { type: 'language' }).of(code) || code
        } catch {
            name = code
        }
        return { code, name: normalizeName(name), file: f }
    })
}

/**
 * Auto-detects locales from the consuming site's `<rootDir>/<MARKUXT_ROOT_DIR>/i18n/`
 * and registers them with @nuxtjs/i18n via the `i18n:registerModule` hook.
 *
 * This keeps locale detection INSIDE the layer — consuming sites need no
 * `locales`/`langDir`/`restructureDir` config and import nothing. The reason a
 * layer module (rather than the layer's `i18n.locales` option) is required:
 * @nuxtjs/i18n v10 resolves each layer's locale `file`s against THAT layer's own
 * rootDir, and this layer ships no locale files — they live in each consumer's
 * src/i18n/. Registering via the hook with an absolute langDir (resolved against
 * the consumer's project root) sidesteps that per-layer resolution entirely.
 */
export default defineNuxtModule({
    meta: { name: 'markuxt-i18n-locales' },
    setup(_options, nuxt) {
        const rootDir = process.env.MARKUXT_ROOT_DIR || 'src/'
        const i18nDir = resolve(nuxt.options.rootDir, join(rootDir, 'i18n'))
        const locales = detectLocales(i18nDir)
        if (!locales.length) return

        // applyLayerOptions() calls this hook at `modules:done`, so registration
        // order relative to @nuxtjs/i18n does not matter.
        nuxt.hook('i18n:registerModule', (register: (cfg: { langDir: string; locales: typeof locales }) => void) => {
            register({ langDir: i18nDir, locales })
        })
    },
})
