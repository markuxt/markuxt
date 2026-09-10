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
      members?: {
        // Member categories. `key` matches the `category:` field in member
        // markdown frontmatter; `labelKey` is the i18n key for the display
        // name. Array order = display / filter / sort order. There are no
        // built-in defaults — declare your categories here.
        //
        // Each category gets its own route (`/members/<key>`, plus
        // `/members/all`); `/members` redirects to the first category.
        // `groupByRole: true` splits a category's listing into sub-sections
        // headed by each member's `role:` frontmatter (first-appearance
        // order), e.g. Senior Research Assistants vs Research Assistants.
        categories?: Array<{
          key: string
          labelKey: string
          groupByRole?: boolean
        }>
      }
    }
  }
}

export { }
