/**
 * GitHub-card server plugin — converts `::github{repo="owner/repo"}` MDC blocks
 * into rich repository cards at parse time.
 *
 * Uses `content:file:afterParse` so the whole transform stays in TypeScript and
 * runs during content parsing, matching the link-card implementation.
 */

const FETCH_TIMEOUT_MS = 10_000
const githubCache = new Map<string, Promise<GithubCardMetadata>>()

interface GithubCardMetadata {
  repo: string
  owner: string
  name: string
  url: string
  description: string
  language: string
  stars: string
  forks: string
  license: string
  avatarUrl: string
}

function buildUserAgent(): string {
  try {
    const config = useAppConfig() as { markuxt?: { contact?: { email?: string; externalUrl?: string } } }
    const contact = config?.markuxt?.contact
    const site = contact?.externalUrl
      ? new URL(contact.externalUrl).hostname
      : 'markuxt-site'
    const email = contact?.email ?? 'unknown'
    return `Mozilla/5.0 (compatible; GithubCardBot/1.0; +mailto:${email}; +https://${site})`
  } catch {
    return 'Mozilla/5.0 (compatible; GithubCardBot/1.0)'
  }
}

function isValidRepo(value: string): boolean {
  return /^[^/\s]+\/[^/\s]+$/.test(value)
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

function formatCompactNumber(value: number): string {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value).replaceAll('\u202f', '')
}

function createFallbackMetadata(repo: string): GithubCardMetadata {
  const [owner = repo, name = 'repository'] = repo.split('/')

  return {
    repo,
    owner,
    name,
    url: `https://github.com/${repo}`,
    description: 'Repository preview unavailable',
    language: 'Unknown',
    stars: '0',
    forks: '0',
    license: 'no-license',
    avatarUrl: '',
  }
}

async function fetchGithubMetadata(repo: string): Promise<GithubCardMetadata> {
  const cached = githubCache.get(repo)
  if (cached) return cached

  const task = (async () => {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'user-agent': buildUserAgent(),
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json() as {
      html_url?: string
      description?: string | null
      language?: string | null
      forks?: number
      stargazers_count?: number
      owner?: { login?: string | null; avatar_url?: string | null }
      name?: string | null
      license?: { spdx_id?: string | null; name?: string | null } | null
    }

    const owner = data.owner?.login || repo.split('/')[0]
    const name = data.name || repo.split('/')[1] || repo

    return {
      repo,
      owner,
      name,
      url: data.html_url || `https://github.com/${repo}`,
      description: decodeHtml(data.description || '') || 'Description not set',
      language: data.language || 'Unknown',
      stars: formatCompactNumber(data.stargazers_count || 0),
      forks: formatCompactNumber(data.forks || 0),
      license: data.license?.spdx_id || data.license?.name || 'no-license',
      avatarUrl: data.owner?.avatar_url || '',
    }
  })()

  githubCache.set(repo, task)

  try {
    return await task
  } catch (error) {
    githubCache.delete(repo)
    throw error
  }
}

function createTextNode(value: string): ContentNode {
  return { type: 'text', value }
}

function createElementNode(tag: string, props: Record<string, unknown>, children: ContentNode[] = []): ContentNode {
  return { type: 'element', tag, props, children }
}

function createGithubCardNode(metadata: GithubCardMetadata): ContentNode {
  const avatarStyle = metadata.avatarUrl
    ? `background-image: url("${escapeCssUrl(metadata.avatarUrl)}"); background-size: cover; background-position: center; background-color: transparent;`
    : ''

  return createElementNode(
    'a',
    {
      class: 'card-github no-styling',
      href: metadata.url,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    [
      createElementNode('div', { class: 'gc-titlebar' }, [
        createElementNode('div', { class: 'gc-titlebar-left' }, [
          createElementNode('div', { class: 'gc-owner' }, [
            createElementNode('div', { class: 'gc-avatar', style: avatarStyle }, []),
            createElementNode('div', { class: 'gc-user' }, [createTextNode(metadata.owner)]),
          ]),
          createElementNode('div', { class: 'gc-divider' }, [createTextNode('/')]),
          createElementNode('div', { class: 'gc-repo' }, [createTextNode(metadata.name)]),
        ]),
        createElementNode('div', { class: 'github-logo', 'aria-hidden': 'true' }, []),
      ]),
      createElementNode('div', { class: 'gc-description' }, [createTextNode(metadata.description)]),
      createElementNode('div', { class: 'gc-infobar' }, [
        createElementNode('div', { class: 'gc-stars' }, [createTextNode(metadata.stars)]),
        createElementNode('div', { class: 'gc-forks' }, [createTextNode(metadata.forks)]),
        createElementNode('div', { class: 'gc-license' }, [createTextNode(metadata.license)]),
        createElementNode('span', { class: 'gc-language' }, [createTextNode(metadata.language)]),
      ]),
    ],
  )
}

function collectGithubCards(node: ContentNode, results: { node: ContentNode; index: number; parent: ContentNode }[]): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) collectGithubCards(child, results)
    return
  }

  if (node.children && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (child?.tag === 'github' && typeof child.props?.repo === 'string' && isValidRepo(child.props.repo)) {
        results.push({ node: child, index: i, parent: node })
      }
      collectGithubCards(child, results)
    }
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', async (file) => {
    if (!file._id.endsWith('.md') || !file.body) return

    const githubCards: { node: ContentNode; index: number; parent: ContentNode }[] = []
    collectGithubCards(file.body, githubCards)
    if (!githubCards.length) return

    const tasks = githubCards.map(async ({ node, index, parent }) => {
      const repo = node.props!.repo as string
      let metadata = createFallbackMetadata(repo)

      try {
        metadata = await fetchGithubMetadata(repo)
      } catch (error) {
        console.warn(`[GITHUB-CARD] Failed to fetch metadata for ${repo}:`, error)
      }

      parent.children![index] = createGithubCardNode(metadata)
    })

    await Promise.allSettled(tasks)
  })
})
