// Normalize publication markdown bodies before Nuxt Content parses them.
//
// Machine-generated publications (e.g. scraped from OpenAlex) sometimes start
// the body with a redundant "Abstract" heading — either raw HTML like
// `<h3>Abstract</h3> <text…>` or markdown `## Abstract`. Two problems result:
//
//   1. The detail page already renders its own "Abstract" section header, so a
//      body heading duplicates it.
//   2. The inline raw-HTML form `<h3>Abstract</h3> text` is parsed as a heading
//      element and the trailing text on the same line is dropped, leaving the
//      section showing only the word "Abstract".
//
// Stripping a single leading Abstract heading (HTML or markdown) before parsing
// leaves clean body text that renders correctly under the page's own header.
// Idempotent: bodies that don't start with such a heading are untouched, and
// only the *first* heading is removed so an "Abstract" heading mid-document
// (e.g. inside a multi-section paper) is preserved.

const LEADING_ABSTRACT_HEADING = /^\s*(?:<h[1-6][^>]*>\s*Abstract\s*<\/h[1-6]>\s*|#{1,6}\s+Abstract\s*\n+)\s*/

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:beforeParse', (file: any) => {
    if (!file?._id?.endsWith('.md')) return
    // _id looks like `content:publications:2022:some-paper.md`.
    if (!String(file._id).includes(':publications:')) return
    if (typeof file.body !== 'string') return

    const next = file.body.replace(LEADING_ABSTRACT_HEADING, '')
    if (next !== file.body) file.body = next
  })
})
