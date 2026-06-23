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
    } else {
      file.locale = defaultLocale
    }
  })
})
