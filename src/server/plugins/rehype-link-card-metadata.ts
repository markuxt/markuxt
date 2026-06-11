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

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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

    const tasks = links.map(async ({ node, index, parent }) => {
      const url = node.props!.url as string
      let metadata = createFallbackMetadata(url)

      try {
        metadata = await fetchMetadata(url)
      } catch (error) {
        console.warn(`[LINK-CARD] Failed to fetch metadata for ${url}:`, error)
      }

      parent.children![index] = createCardNode(url, metadata)
    })

    await Promise.allSettled(tasks)
  })
})
