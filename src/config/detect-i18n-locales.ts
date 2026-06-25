import { readdirSync } from 'fs'
import { join } from 'path'

/**
 * Normalize a locale display name for the top-right language switcher:
 *   - convert full-width/special brackets to ASCII: （ ） → ( )
 *   - ensure exactly one space before '('
 *   - ensure no space before ')'
 * e.g. "中文（中国）" → "中文 (中国)", "português (Brasil)" → unchanged.
 */
function normalizeName(name: string): string {
    return name
        .replace(/（/g, '(') // （ → (
        .replace(/）/g, ')') // ） → )
        .replace(/\s*\(/g, ' (') // collapse any spaces before '(' into one
        .replace(/\s+\)/g, ')')  // drop spaces before ')'
        .trim()
}

/**
 * Auto-detect locales from <rootDir>/i18n/*.json at build time.
 * Each file (minus .json) is a locale code: en.json → 'en', zh-CN.json → 'zh-CN'.
 * The display name is resolved via Intl.DisplayNames in the locale's own
 * language (e.g. 'en' → 'English', 'zh-CN' → '中文 (简体)').
 *
 * This runs in the CONSUMER's nuxt.config (cwd = consumer project), NOT in the
 * markuxt layer. The layer itself ships no locale files, and @nuxtjs/i18n v10
 * resolves each layer's `locales[].file` against THAT LAYER's own rootDir — so
 * if the layer declared locales they would ENOENT under markuxt/locales/.
 * Consumers own the files, so consumers must declare the locales.
 *
 * @param rootDir content root containing the `i18n/` folder (default 'src/').
 */
export function detectI18nLocales(rootDir = 'src/') {
    const dir = join(process.cwd(), rootDir, 'i18n')
    let files: string[] = []
    try {
        files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    } catch {
        // i18n dir not found — return empty; consumer must declare locales manually
    }
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
