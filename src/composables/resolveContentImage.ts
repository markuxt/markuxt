/**
 * Resolve a relative image path from content frontmatter to an absolute /_markuxt/ URL.
 *
 * Authors write `image: photo.webp` in frontmatter; this function converts it
 * to `/_markuxt/members/staff/photo.webp` based on the source file location.
 *
 * Supports `../` for cross-directory references (e.g. shared placeholders).
 * Absolute paths (`/...`, `http...`) pass through unchanged.
 */
export function resolveContentImage(
  image: string | undefined,
  contentId: string | undefined,
): string {
  if (!image) return ''
  if (image.startsWith('/') || image.startsWith('http') || image.startsWith('//')) {
    return image
  }
  if (!contentId) return image

  // _id format in Nuxt Content v2: 'content:members:staff:salman-ijaz.md'
  // Split by ':', drop 'content' prefix and filename, rejoin as directory path
  const parts = contentId.split(':')
  if (parts.length < 3) return image

  const dirSegments = parts.slice(1, -1) // e.g. ['members', 'staff']

  // Normalize: resolve ../ and ./
  const resolved = [...dirSegments]
  for (const seg of image.split('/')) {
    if (seg === '..') resolved.pop()
    else if (seg !== '.') resolved.push(seg)
  }

  return '/_markuxt/' + resolved.join('/')
}
