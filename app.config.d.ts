declare module 'nuxt/schema' {
  interface AppConfig {
    markuxt?: {
      theme?: {
        preset?: 'seaside' | 'forest' | 'sunset' | 'slate'
        mode?: 'light' | 'dark' | 'auto'
      }
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

export { }
