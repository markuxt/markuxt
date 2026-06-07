import type { Router } from 'vue-router'

export default defineNuxtPlugin(() => {
  const appConfig = useAppConfig()
  const allowedPaths = new Set(
    (appConfig.markuxt?.navigation || []).map((item: { to: string }) => item.to)
  )

  addRouteMiddleware('navigation-guard', (to) => {
    // Only guard markuxt section pages (members, publications, projects, positions, news)
    const markuxtSections = ['/members', '/publications', '/projects', '/positions', '/news']
    const isMarkuxtPage = markuxtSections.some(section => to.path.startsWith(section))

    if (isMarkuxtPage) {
      // Check if any allowed path matches this route's section
      const sectionPath = '/' + to.path.split('/')[1]
      if (!allowedPaths.has(sectionPath)) {
        return abortNavigation(createError({ statusCode: 404, statusMessage: 'Page Not Found' }))
      }
    }
  }, { global: true })
})
