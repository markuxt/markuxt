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

    // Site-specific head — TODO: replace /images/favicon.png with your own
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

    // Runtime app config (markuxt theme options) — customize everything below for your site.
    // Field contract: see node_modules/@markuxt/markuxt/app.config.d.ts
    appConfig: {
        markuxt: {
            // TODO: replace with your institution/lab logo (place under src/public/images/)
            logo: {
                src: '/images/logo.png',
            },
            navigation: [
                { to: '/', labelKey: 'nav.home' },
                { to: '/members', labelKey: 'nav.members' },
                { to: '/publications', labelKey: 'nav.publications' },
                { to: '/projects', labelKey: 'nav.projects' },
                { to: '/positions', labelKey: 'nav.positions' },
                { to: '/news', labelKey: 'nav.news' },
            ],
            // TODO: replace with your lab's contact email and institution URL
            contact: {
                email: 'contact@your-lab.edu',
                externalUrl: 'https://your-university.edu',
                externalLabelKey: 'footer.universityLink',
            },
            // TODO: replace carousel images with your own (place under src/public/images/)
            carousel: {
                fallbackImage: '/images/logo.png',
                images: [
                    {
                        src: '/images/logo.png',
                        alt: 'Lab logo',
                        caption: 'Your Lab at Your University',
                    },
                    {
                        src: '/images/logo.png',
                        alt: 'Team photo',
                        caption: 'Meet our team!',
                    },
                ],
            },
            // Homepage research-area cards.
            // Icons are registered in ./plugins/icons.ts; labels live in src/i18n/*.json.
            researchAreas: [
                { icon: 'IconSearch', titleKey: 'research.area1', descKey: 'research.area1Desc' },
                { icon: 'IconRobot', titleKey: 'research.area2', descKey: 'research.area2Desc' },
                { icon: 'IconNeural', titleKey: 'research.area3', descKey: 'research.area3Desc' },
                { icon: 'IconAssemblyLine', titleKey: 'research.area4', descKey: 'research.area4Desc' },
            ],
        },
    },
});
