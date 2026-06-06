/**
 * Nuxt Content transformer for binary asset files (images, videos, etc.).
 *
 * Without this, @nuxt/content warns for every binary file in content/:
 *   ".webp files are not supported … falling back to raw content"
 *
 * This transformer claims those extensions so the built-in parser never
 * falls through to the warning path.
 */
export default {
  name: 'binary-assets',
  extensions: [
    '\\.png', '\\.jpe?g', '\\.gif', '\\.webp', '\\.svg', '\\.ico',
    '\\.mp4', '\\.webm', '\\.avi', '\\.mov', '\\.mkv',
    '\\.pdf', '\\.zip', '\\.tar', '\\.gz',
    '\\.woff2?', '\\.ttf', '\\.eot',
    '\\.mp3', '\\.wav', '\\.ogg', '\\.flac',
  ],
  parse: async (_id: string, content: string) => ({ _id, _type: 'binary', body: content }),
}
