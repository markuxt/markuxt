/**
 * Link-card server plugin — converts `::link{url="https://..."}` MDC blocks
 * into rich preview cards (title, description, image, domain) at parse time.
 *
 * Uses `content:file:afterParse` hook instead of a rehype plugin so the
 * implementation stays in TypeScript (rehype plugins are serialized into
 * mdc-imports.mjs which Node loads directly — no Vite TS compilation).
 */

// Use ::link{url="https://example.com"} to add a link card in markdown.

const FETCH_TIMEOUT_MS = 10_000
const metadataCache = new Map<string, Promise<LinkCardMetadata>>()

/** Build a polite User-Agent from the site's own contact info (appConfig.markuxt.contact). */
function buildUserAgent(): string {
  try {
    const config = useAppConfig() as { markuxt?: { contact?: { email?: string; externalUrl?: string } } }
    const contact = config?.markuxt?.contact
    const site = contact?.externalUrl
      ? new URL(contact.externalUrl).hostname
      : 'markuxt-site'
    const email = contact?.email ?? 'unknown'
    return `Mozilla/5.0 (compatible; LinkCardBot/1.0; +mailto:${email}; +https://${site})`
  } catch {
    return 'Mozilla/5.0 (compatible; LinkCardBot/1.0)'
  }
}

interface LinkCardMetadata {
  title: string
  description: string
  image: string
  domain: string
}

// Use ::link{url="https://example.com"} to add a link card in markdown.

function getMetaContent(html: string, selectors: string[]): string {
  for (const selector of selectors) {
    const pattern = new RegExp(
      `<meta\\s+[^>]*(?:property|name)=["']${selector}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${selector}["'][^>]*>`,
      'i',
    )
    const match = html.match(pattern)
    if (match?.[1] || match?.[2]) return decodeHtml(match[1] || match[2])
  }

  return ''
}

function getTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? decodeHtml(match[1].replace(/\s+/g, ' ').trim()) : ''
}

function getFavicon(html: string, pageUrl: string): string {
  const match = html.match(
    /<link\s+[^>]*rel=["'][^"']*(?:icon|shortcut icon|apple-touch-icon)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  )
  if (!match?.[1]) return ''

  return toAbsoluteUrl(match[1], pageUrl)
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function toAbsoluteUrl(value: string, pageUrl: string): string {
  try {
    return new URL(value, pageUrl).toString()
  } catch {
    return ''
  }
}

const HTML_NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
}

function decodeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return ''
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => decodeCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => decodeCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (_, name) => HTML_NAMED_ENTITIES[name] ?? `&${name};`)
    .trim()
}

function escapeCssUrl(value: string): string {
  return value.replace(/["\\\n\r\f]/g, '\\$&')
}

function createFallbackMetadata(url: string): LinkCardMetadata {
  return {
    title: url,
    description: '',
    image: '',
    domain: getHostname(url),
  }
}

async function fetchMetadata(url: string): Promise<LinkCardMetadata> {
  const cached = metadataCache.get(url)
  if (cached) return cached

  const task = (async () => {
    const response = await fetch(url, {
      headers: {
        'user-agent': buildUserAgent(),
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const html = await response.text()
    return {
      title: getMetaContent(html, ['og:title', 'twitter:title']) || getTitle(html) || url,
      description: getMetaContent(html, ['og:description', 'twitter:description', 'description']),
      image:
        toAbsoluteUrl(
          getMetaContent(html, ['og:image', 'twitter:image', 'twitter:image:src']),
          url,
        ) || getFavicon(html, url),
      domain: getHostname(url),
    }
  })()

  metadataCache.set(url, task)

  try {
    return await task
  } catch (error) {
    metadataCache.delete(url)
    throw error
  }
}

/** Build a card node in Nuxt Content body-tree format ({ type, tag, props, children }). */
function createCardNode(url: string, metadata: LinkCardMetadata) {
  const imageStyle = metadata.image
    ? `background-image: url("${escapeCssUrl(metadata.image)}"); background-size: cover; background-position: center;`
    : ''

  const children: ContentNode[] = [
    { type: 'element', tag: 'div', props: { class: 'lc-image', style: imageStyle }, children: [] },
    {
      type: 'element',
      tag: 'div',
      props: { class: 'lc-body' },
      children: [
        { type: 'element', tag: 'div', props: { class: 'lc-title' }, children: [{ type: 'text', value: metadata.title || url }] },
        ...(metadata.description
          ? [{ type: 'element', tag: 'div', props: { class: 'lc-description' }, children: [{ type: 'text', value: metadata.description }] }]
          : []),
        { type: 'element', tag: 'div', props: { class: 'lc-domain' }, children: [{ type: 'text', value: metadata.domain }] },
      ],
    },
  ]

  return {
    type: 'element',
    tag: 'a',
    props: {
      class: 'card-link no-styling',
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    children,
  }
}

/** Collect all link nodes in the body tree for batch processing. */
function collectLinks(node: ContentNode, results: { node: ContentNode; index: number; parent: ContentNode }[]): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) collectLinks(child, results)
    return
  }
  if (node.children && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (child?.tag === 'link' && typeof child.props?.url === 'string' && /^https?:\/\//.test(child.props.url)) {
        results.push({ node: child, index: i, parent: node })
      }
      collectLinks(child, results)
    }
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', async (file) => {
    if (!file._id.endsWith('.md') || !file.body) return

    const links: { node: ContentNode; index: number; parent: ContentNode }[] = []
    collectLinks(file.body, links)
    if (!links.length) return

    // Fetch metadata for every link in parallel.
    const results = await Promise.allSettled(
      links.map(async ({ node }) => {
        const url = node.props!.url as string
        try {
          return { url, metadata: await fetchMetadata(url) }
        } catch (error) {
          console.warn(`[LINK-CARD] Failed to fetch metadata for ${url}:`, error)
          return { url, metadata: createFallbackMetadata(url) }
        }
      }),
    )

    // Apply replacements grouped by parent, splicing in descending index order
    // so earlier indices stay valid. Re-insert any children MDC absorbed into
    // the block component as siblings after the card (same fix as github-card).
    const groups = new Map<ContentNode, { index: number; card: ContentNode; absorbed: ContentNode[] }[]>()
    results.forEach((res, i) => {
      if (res.status !== 'fulfilled') return
      const { node, index, parent } = links[i]
      const absorbed = node.children && node.children.length > 0 ? node.children : []
      const arr = groups.get(parent) ?? []
      arr.push({ index, card: createCardNode(res.value.url, res.value.metadata), absorbed })
      groups.set(parent, arr)
    })

    for (const [parent, arr] of groups) {
      arr.sort((a, b) => b.index - a.index)
      for (const { index, card, absorbed } of arr) {
        parent.children!.splice(index, 1, card, ...absorbed)
      }
    }
  })
})
