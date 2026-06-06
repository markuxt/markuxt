declare module 'nuxt/schema' {
  interface AppConfig {
    markuxt?: {
      logo?: {
        src?: string
      }
      navigation?: Array<{
        to: string
        labelKey: string
      }>
      contact?: {
        email?: string
        externalUrl?: string
        externalLabelKey?: string
      }
      carousel?: {
        fallbackImage?: string
        images?: Array<{
          src: string
          alt?: string
          caption?: string
        }>
      }
      researchAreas?: Array<{
        icon: string
        titleKey: string
        descKey: string
      }>
    }
  }
}

export {}
