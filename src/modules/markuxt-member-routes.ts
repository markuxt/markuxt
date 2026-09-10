import { defineNuxtModule } from '@nuxt/kit'

/**
 * Preregister the per-category member routes (/members/<key>, /members/all)
 * for prerendering.
 *
 * `/members` itself prerenders as a redirect page (meta-refresh to the first
 * category on static hosting), which the prerender crawler does not follow —
 * so the category pages are enumerated here from the merged appConfig.
 * Runs as a module so `nitro:init` is hooked well before Nitro is created
 * (hook chains from nuxt.config hooks can race it).
 */
export default defineNuxtModule({
  meta: {
    name: 'markuxt-member-routes',
  },
  setup(_options, nuxt) {
    nuxt.hooks.hook('nitro:init', (nitro) => {
      const categories = (nuxt.options.appConfig as {
        markuxt?: { members?: { categories?: Array<{ key: string }> } }
      })?.markuxt?.members?.categories ?? []

      nitro.hooks.hook('prerender:routes', (routes: Set<string>) => {
        routes.add('/members/all')
        for (const category of categories) {
          routes.add(`/members/${category.key}`)
        }
      })
    })
  },
})
