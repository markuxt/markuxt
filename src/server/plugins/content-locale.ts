// Content locale detection from filename suffixes.
//
// Recognizes locale from Markdown filenames:
//   - `page.md`          → locale 'en' (default)
//   - `page.en.md`       → locale 'en'
//   - `page.en-US.md`    → locale 'en'
//   - `page.zh.md`       → locale 'zh-CN'
//   - `page.zh-CN.md`    → locale 'zh-CN'
//
// Sets `file.locale` and normalizes `_path` so locale variants
// share the same path (e.g. `salman-ijaz.zh-CN.md` → `/members/staff/salman-ijaz`).

const LOCALE_PATTERN = /\.(en|en-US|zh|zh-CN)\.md$/

// Normalize locale codes to the canonical form used by @nuxtjs/i18n
function normalizeLocale(raw: string): string {
  if (raw === 'en-US' || raw === 'en') return 'en'
  if (raw === 'zh' || raw === 'zh-CN') return 'zh-CN'
  return raw
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', (file: any) => {
    if (!file?._id || typeof file._id !== 'string') return

    // Only process Markdown files
    if (!file._id.endsWith('.md')) return

    const match = file._id.match(LOCALE_PATTERN)

    if (match) {
      file.locale = normalizeLocale(match[1])

      // Strip locale suffix from _path so variants share the same route
      // e.g. `/members/staff/salman-ijaz-zh-cn` → `/members/staff/salman-ijaz`
      if (file._path) {
        file._path = file._path.replace(
          new RegExp(`-(?:en|en-US|zh|zh-CN)$`),
          ''
        )
      }
    } else {
      // No locale suffix = default locale
      file.locale = 'en'
    }
  })
})
