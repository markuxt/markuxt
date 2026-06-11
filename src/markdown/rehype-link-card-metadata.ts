import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

const USER_AGENT = 'Mozilla/5.0 (compatible; NuxtLinkCard/1.0; +https://calc1te.github.io/)'
const FETCH_TIMEOUT_MS = 10_000
const metadataCache = new Map<string, Promise<LinkCardMetadata>>()

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
        'user-agent': USER_AGENT,
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

function createCard(url: string, metadata: LinkCardMetadata) {
  const imageStyle = metadata.image
    ? `background-image: url("${escapeCssUrl(metadata.image)}"); background-size: cover; background-position: center;`
    : ''

  return h(
    'a',
    {
      class: 'card-link no-styling',
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    [
      h('div', { class: 'lc-image', style: imageStyle }),
      h('div', { class: 'lc-body' }, [
        h('div', { class: 'lc-title' }, metadata.title || url),
        metadata.description
          ? h('div', { class: 'lc-description' }, metadata.description)
          : null,
        h('div', { class: 'lc-domain' }, metadata.domain),
      ].filter(Boolean)),
    ],
  )
}

export function rehypeLinkCardMetadata() {
  return async (tree: any) => {
    const tasks: Promise<void>[] = []

    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (node.tagName !== 'link' || !parent || index == null) return

      const url = node.properties?.url
      if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return

      tasks.push(
        (async () => {
          let metadata = createFallbackMetadata(url)

          try {
            metadata = await fetchMetadata(url)
          } catch (error) {
            console.warn(`[LINK-CARD] Failed to fetch metadata for ${url}:`, error)
          }

          parent.children[index] = createCard(url, metadata)
        })(),
      )
    })

    await Promise.allSettled(tasks)
  }
}
