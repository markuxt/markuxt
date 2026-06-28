// Content locale detection from Markdown filename suffixes, with `_path`
// collapse so locale variants SHARE one route.
//
//   page.md          → locale = defaultLocale, _path /.../page
//   page.en.md       → locale 'en',        _path /.../page
//   page.zh.md       → locale 'zh',        _path /.../page
//   page.zh-CN.md    → locale 'zh-CN',     _path /.../page

const LOCALE_SUFFIX = /\.([a-z]{2}(?:-[a-z0-9]{2,3})?)\.md$/i

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', (file: any) => {
    if (!file?._id || typeof file._id !== 'string' || !file._id.endsWith('.md')) return

    let defaultLocale = 'en'
    try {
      defaultLocale = (useRuntimeConfig().public as any)?.i18n?.defaultLocale || 'en'
    } catch { /* runtime config unavailable */ }

    const match = file._id.match(LOCALE_SUFFIX)
    if (match) {
      const code = match[1]
      file.locale = code
      // Collapse the dot-suffix from _path so variants share one route.
      if (file._path) {
        file._path = file._path.replace(new RegExp(`\\.${escapeRegex(code)}$`, 'i'), '')
      }
      // Strip a filename-derived auto-title. Nuxt Content's path-meta transformer
      // sets `title = content.title || generateTitle(basename)`, so a PARTIAL
      // locale variant (which omits `title`) gets a meaningless title built from
      // the filename (e.g. "HnrobertZh CN"). That would win the field-merge and
      // override the default's real title. Detect it by comparing the normalised
      // title to the normalised filename stem; a genuine frontmatter title won't
      // match. Only applies to suffixed variants — default files keep their title.
      if (typeof file.title === 'string') {
        const idLast = file._id.split(':').pop() || ''           // "hnrobert.zh-CN.md"
        const stem = idLast.replace(/\.md$/i, '')                 // "hnrobert.zh-CN"
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (norm(file.title) === norm(stem)) {
          delete file.title
        }
      }
    } else {
      file.locale = defaultLocale
    }
  })
})
