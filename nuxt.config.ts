// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'fs'
import { join, parse, extname, relative, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Sync non-document files (images, videos, etc.) from content/ to public/_content/.
 * This lets authors place assets next to their markdown files in content/ while
 * still serving them as static files at build time (Nuxt Content v2 ignores
 * binary files in content/).
 *
 * Source:  src/content/members/staff/salman-ijaz.webp
 * Target:  src/public/_content/members/staff/salman-ijaz.webp
 * URL:     /_content/members/staff/salman-ijaz.webp
 */
function syncContentAssets(contentDir: string, publicDir: string) {
  const docExtensions = new Set(['.md', '.mdx', '.yml', '.yaml', '.json', '.csv'])
  const targetDir = join(publicDir, '_content')

  // Clean previous output so stale files don't linger
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true })
  }

  let copiedCount = 0

  function walk(dir: string) {
    if (!existsSync(dir)) return
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase()
        if (!docExtensions.has(ext)) {
          const rel = relative(contentDir, fullPath)
          const destPath = join(targetDir, rel)
          const destDir = parse(destPath).dir
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true })
          }
          copyFileSync(fullPath, destPath)
          copiedCount++
        }
      }
    }
  }

  walk(contentDir)
  console.log(`[Content Assets] Synced ${copiedCount} asset(s) from content/ → public/_content/`)
}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Source directory
  srcDir: 'src/',

  // Nuxt Content module + i18n
  modules: ['@nuxt/content', '@nuxtjs/i18n'],

  // i18n defaults — consuming site overrides locales and langDir
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root'
    }
  },

  // Build-time hooks
  hooks: {
    // Register a custom transformer for binary assets (images, videos, etc.)
    // so @nuxt/content does not warn about unsupported file extensions.
    'content:context': (ctx: { transformers: string[] }) => {
      ctx.transformers.push(
        resolve(__dirname, 'src/content-transformers/binary-assets.ts')
      )
    },
    'build:before': () => {
      // Sync content assets (images/videos next to markdown) to public/_content/
      syncContentAssets(
        join(process.cwd(), 'src/content'),
        join(process.cwd(), 'src/public')
      )

      // Auto-detect carousel images at build time
      // Images are located in src/content/assets/carousel/ and synced to public/_content/assets/carousel/
      const carouselDir = join(process.cwd(), 'src/content/assets/carousel')
      const manifestPath = join(process.cwd(), 'src/content/carousel-manifest.json')

      const images: Array<{ src: string; alt: string; caption: string }> = []

      if (existsSync(carouselDir)) {
        const files = readdirSync(carouselDir)
        const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg']

        files.forEach(file => {
          const ext = parse(file).ext.toLowerCase()
          if (imageExtensions.includes(ext)) {
            const nameWithoutExt = parse(file).name
            // Convert filename to readable caption (e.g., "lab-1" -> "Lab 1")
            const caption = nameWithoutExt
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())

            images.push({
              src: `/_content/assets/carousel/${file}`,
              alt: caption,
              caption: caption
            })
          }
        })
      }

      // Only write manifest when images are found — avoid overwriting with empty array
      if (images.length > 0) {
        writeFileSync(manifestPath, JSON.stringify(images, null, 2))
        console.log(`[Carousel] Found ${images.length} images in carousel directory`)
      } else {
        console.log('[Carousel] No images found in carousel directory, keeping existing manifest')
      }
    }
  },

  // App configuration
  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        // Favicon is site-specific — consuming site adds it in its own nuxt.config
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,100;0,9..144,200;0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,100;1,9..144,200;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700;1,9..144,800;1,9..144,900&display=swap' }
      ],
      script: []
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    baseURL: process.env.NUXT_PUBLIC_BASE_URL || '/'
  },

  // CSS — resolve relative to layer root, not the consuming site
  css: [resolve(__dirname, 'src/assets/main.css')],

  // Content module configuration
  content: {
    highlight: {
      theme: {
        default: 'github-light',
        dusk: 'github-dark'
      }
    },
    navigation: {
      fields: ['icon', 'title', 'description']
    },
    markdown: {
      tags: {
        img: 'ProseImg',
        video: 'ProseVideo'
      },
      remarkPlugins: {
        'remark-math': {}
      },
      rehypePlugins: {
        'rehype-katex': {
          output: 'htmlAndMathml',
          strict: false
        }
      }
    }
  },

  // Nitro configuration
  nitro: {
    baseURL: process.env.NUXT_PUBLIC_BASE_URL || '/'
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false
  },

  // Vite
  vite: {
    optimizeDeps: {
      include: ['@nuxt/content']
    }
  }
})
