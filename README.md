# Markuxt

<div align="center">
  <img src="https://raw.githubusercontent.com/markuxt/markuxt/main/src/public/images/logo.png" alt="Markuxt" width="360" />
  <!-- <h1>Markuxt</h1> -->
</div>

A Markdown-first academic portal framework for laboratories, research groups, and knowledge communities, powered by [Nuxt 3](https://nuxt.com/).

Markuxt provides a complete theme layer — layouts, pages, components, content transformers, and i18n — so that consuming sites only need to provide **content** and **configuration**.

## Features

- **Markdown-driven content** — Pages, members, publications, projects, positions, and news are all authored in Markdown with YAML frontmatter.
- **Configurable navigation** — Define which pages appear in the header, footer, and route guard via a single `navigation` array in `appConfig`.
- **Internationalization** — Built-in i18n support via `@nuxtjs/i18n`. Consuming sites provide their own locale files.
- **Design system** — CSS custom properties for colors, spacing, typography, and more. Easy to override.
- **Content transformers** — Binary assets (images, videos) placed next to Markdown files are automatically synced to `public/` for static serving.
- **Mermaid diagrams** — First-class support with proper font loading and overflow handling.
- **LaTeX / KaTeX** — Math rendering via `remark-math` + `rehype-katex`.
- **404 page** — Custom error page with header and footer preserved.

## Architecture

```bash
markuxt/
├── nuxt.config.ts            # Layer configuration (modules, hooks, vite, etc.)
├── app.config.d.ts           # TypeScript declarations for markuxt AppConfig
├── src/
│   ├── assets/main.css       # Design system & global styles
│   ├── components/           # Vue components (AppHeader, AppFooter, Hero, etc.)
│   ├── composables/          # Shared composables
│   ├── content-transformers/ # Custom Nuxt Content transformers
│   ├── error.vue             # Custom 404 error page
│   ├── layouts/default.vue   # Default layout with header + footer
│   ├── middleware/            # Route middleware (navigation guard)
│   ├── pages/                # All page routes
│   │   ├── index.vue         # Homepage
│   │   ├── members/          # Members listing & detail pages
│   │   ├── news/             # News listing & detail pages
│   │   ├── positions/        # Open positions
│   │   ├── projects/         # Projects listing & detail pages
│   │   └── publications/     # Publications listing & detail pages
│   ├── plugins/              # Nuxt plugins
│   └── server/plugins/       # Server-side Nitro plugins
└── package.json
```

## Configuration Reference

Consuming sites configure Markuxt through `appConfig.markuxt` in their `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  appConfig: {
    markuxt: {
      // Theme preset - change this value in repo config to switch the site theme
      theme: {
        preset: 'ocean', // 'ocean' | 'forest' | 'sunset' | 'slate'
        mode: 'auto', // 'light' | 'dark' | 'auto'
      },

      // Logo image path
      logo: {
        src: '/images/logo.png',
      },

      // Navigation items — controls header nav, footer quick links,
      // and route guarding. Pages NOT listed here will return 404.
      navigation: [
        { to: '/', labelKey: 'nav.home' },
        { to: '/members', labelKey: 'nav.members' },
        { to: '/publications', labelKey: 'nav.publications' },
        { to: '/projects', labelKey: 'nav.projects' },
        { to: '/positions', labelKey: 'nav.positions' },
        { to: '/news', labelKey: 'nav.news' },
      ],

      // Contact information shown in footer
      contact: {
        email: 'lab@example.edu',
        externalUrl: 'https://www.example.edu',
        externalLabelKey: 'footer.universityLink', // i18n key
      },

      // Homepage carousel
      carousel: {
        fallbackImage: '/images/logo.png',
        images: [
          { src: '/images/photo1.jpg', alt: 'Lab', caption: 'Our Lab' },
        ],
      },

      // Research areas on homepage — `icon` references a globally
      // registered Vue component name (see Icons section below)
      researchAreas: [
        { icon: 'IconSearch', titleKey: 'research.aerospace', descKey: 'research.aerospaceDesc' },
      ],
    },
  },
})
```

### Navigation Guard

Pages defined in `navigation` are accessible. Any markuxt section page (`/members`, `/publications`, `/projects`, `/positions`, `/news`) that is **not** listed will return a 404. The home page (`/`) is always accessible.

## Icons

Markuxt does **not** bundle any icon library. The consuming site is responsible for registering Vue components globally and referencing them by name in configuration.

Example using `@icon-park/vue-next`:

**`plugins/icons.ts`** (project root, outside `src/` to avoid Content scanning):

```ts
import Search from '@icon-park/vue-next/es/icons/Search'
import Robot from '@icon-puxt/vue-next/es/icons/Robot'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('IconSearch', Search)
  nuxtApp.vueApp.component('IconRobot', Robot)
})
```

**`nuxt.config.ts`**:

```ts
export default defineNuxtConfig({
  plugins: ['~~/plugins/icons.ts'],
  appConfig: {
    markuxt: {
      researchAreas: [
        { icon: 'IconSearch', titleKey: 'research.search', descKey: 'research.searchDesc' },
      ],
    },
  },
})
```

## i18n

Markuxt expects consuming sites to provide translation files. Translation keys used by Markuxt's components (e.g. `nav.home`, `footer.brand`, `members.staff`) must be present in the site's locale JSON files.

## Content Structure

Markuxt uses `@nuxt/content` v2. The consuming site configures the content source directory:

```ts
content: {
  sources: {
    content: {
      driver: 'fs',
      base: resolve(process.cwd(), 'src'),
    },
  },
},
```

Expected content directories under the base:

| Path            | Content Type                    |
|-----------------|---------------------------------|
| `members/`      | Member profiles (Markdown)      |
| `news/`         | News articles (Markdown)        |
| `publications/` | Publication entries (Markdown)  |
| `projects/`     | Project descriptions (Markdown) |
| `positions/`    | Open positions (Markdown)       |

Binary assets (images, videos) placed alongside Markdown files are automatically synced to `public/_markuxt/` during build.

## License

[Apache-2.0](LICENSE)
