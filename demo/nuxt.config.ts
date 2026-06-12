// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'

// Set before markuxt's nuxt.config is evaluated
process.env.MARKUXT_ROOT_DIR = process.env.MARKUXT_ROOT_DIR || 'src/'

export default defineNuxtConfig({
    // Keep the app source at the repo root so template-level layouts override markuxt's defaults.
    srcDir: '.',

    extends: ['@markuxt/markuxt'],

    // Load styles — edit styles/main.css or individual partials to customize
    css: ['~~/styles/main.css'],

    // Register global icon components (outside src/ to avoid Content scanning)
    plugins: ['~~/plugins/icons.ts'],

    // i18n — site-specific locales and translations
    i18n: {
        locales: [
            { code: 'en', name: 'English', file: 'en.json' },
            { code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
        ],
        langDir: '../src/i18n',
    },

    // Site-specific head
    app: {
        head: {
            link: [{ rel: 'icon', type: 'image/png', href: '/images/favicon.png' }],
        },
    },

    // Content directory — content lives directly in src/ (not src/content/)
    content: {
        sources: {
            content: {
                driver: 'fs',
                base: resolve(process.cwd(), 'src'),
            },
        },
    },

    // Vite — follow symlinks so changes in the workspace-linked markuxt layer
    // trigger HMR without restarting the dev server.
    vite: {
        server: {
            watch: {
                followSymlinks: true,
            },
        },
    },

    // Register src/public/ as a static asset directory so that synced content
    // assets (/_markuxt/*) are served correctly even though srcDir is '.'.
    nitro: {
        publicAssets: [{ dir: resolve(process.cwd(), 'src', 'public') }],
    },

    // Runtime app config (markuxt theme options)
    // Field contract: see node_modules/@markuxt/markuxt/app.config.d.ts
    appConfig: {
        markuxt: {
            logo: {
                src: '/images/logo.png',
            },
            navigation: [
                { to: '/', labelKey: 'nav.home' },
                { to: '/projects', labelKey: 'nav.projects' },
                { to: '/members', labelKey: 'nav.members' },
                { to: '/publications', labelKey: 'nav.publications' },
                { to: '/positions', labelKey: 'nav.positions' },
                { to: '/news', labelKey: 'nav.news' },
            ],
            contact: {
                email: '',
                externalUrl: 'https://github.com/markuxt/markuxt',
                externalLabelKey: 'footer.githubLink',
            },
            carousel: {
                fallbackImage: '/images/logo.png',
                images: [
                    {
                        src: '/images/logo.png',
                        alt: 'Markuxt Logo',
                        caption: 'Markdown-first Academic Portal Framework',
                    },
                    {
                        src: '/images/logo.png',
                        alt: 'Markuxt Themes',
                        caption: 'Built-in Themes: Seaside, Forest, Sunset, Slate',
                    },
                ],
            },
            // Homepage feature-highlight cards.
            // Icons are registered in ./plugins/icons.ts; labels live in src/i18n/*.json.
            researchAreas: [
                { icon: 'IconCode', titleKey: 'research.area1', descKey: 'research.area1Desc' },
                { icon: 'IconFileCode', titleKey: 'research.area2', descKey: 'research.area2Desc' },
                { icon: 'IconTranslate', titleKey: 'research.area3', descKey: 'research.area3Desc' },
                { icon: 'IconTheme', titleKey: 'research.area4', descKey: 'research.area4Desc' },
            ],
        },
    },
});
