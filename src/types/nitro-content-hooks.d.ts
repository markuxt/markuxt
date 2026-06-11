/**
 * Type augmentation for @nuxt/content server-side hooks.
 *
 * The 'content:file:afterParse' hook is injected at runtime by @nuxt/content
 * but not declared in nitropack's built-in types. This augmentation makes the
 * hook type-safe in Nitro plugins.
 */
declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'content:file:afterParse': (file: ContentParsed) => void | Promise<void>
  }
}

interface ContentParsed {
  _id: string
  _path?: string
  body?: ContentNode
  [key: string]: unknown
}

interface ContentNode {
  type?: string
  tag?: string
  props?: Record<string, unknown>
  children?: ContentNode[]
  value?: string
}
