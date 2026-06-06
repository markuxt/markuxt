// Fix in-page anchor links for content pasted from GitHub READMEs.
//
// Background: when a heading like `## 🧭 Start Here` is parsed, github-slugger
// produces `-start-here` (emoji dropped, leading dash kept). GitHub uses that
// exact string as the heading's anchor, so hand-written tables of contents link
// to `#-start-here`. Nuxt Content's MDC compiler, however, runs one extra step
// GitHub does not — it strips the leading/trailing dashes — so the heading's id
// becomes `start-here`. The result: every emoji-prefixed TOC link 404s in-page.
//
// Rather than rewrite the markdown (which is correct GitHub syntax), we
// normalize the anchor hrefs at parse time using the SAME rule MDC applies to
// heading ids, so the links converge onto the generated ids. Idempotent, and we
// only rewrite a link when doing so actually points it at a real heading.

// Mirror of MDC's heading-id tail normalization (compiler.js):
//   slug(text).replace(/-+/g, '-').replace(/^-|-$/g, '').replace(/^(\d)/, '_$1')
function normalizeId(fragment: string): string {
  return fragment
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^(\d)/, '_$1')
}

// Collect ids of all heading nodes (h1–h6) in the parsed body AST.
function collectHeadingIds(node: any, ids: Set<string>): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) collectHeadingIds(child, ids)
    return
  }
  if (typeof node.tag === 'string' && /^h[1-6]$/.test(node.tag) && node.props?.id) {
    ids.add(node.props.id)
  }
  if (node.children) collectHeadingIds(node.children, ids)
}

// Rewrite in-page anchor hrefs that only match a heading after normalization.
function fixAnchors(node: any, ids: Set<string>): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) fixAnchors(child, ids)
    return
  }
  if (node.tag === 'a' && typeof node.props?.href === 'string' && node.props.href.startsWith('#')) {
    const fragment = node.props.href.slice(1)
    if (fragment && !ids.has(fragment)) {
      const normalized = normalizeId(fragment)
      if (ids.has(normalized)) {
        node.props.href = '#' + normalized
      }
    }
  }
  if (node.children) fixAnchors(node.children, ids)
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', (file: any) => {
    if (!file?._id?.endsWith('.md') || !file.body?.children) return
    const ids = new Set<string>()
    collectHeadingIds(file.body, ids)
    if (ids.size) fixAnchors(file.body, ids)
  })
})
