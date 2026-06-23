/**
 * Fetch a single content document by its `_path`, in a way that survives a
 * hard refresh on static hosting.
 *
 * Why not `.where({ _extension: 'md' }).findOne()`? A filtered findOne is NOT
 * payload-cached by Nuxt Content, so on a full page load (refresh) the client
 * re-fetches the (never-prerendered) findOne query JSON → 404. A plain
 * path-based `findOne()` IS payload-cached, so the client uses the prerendered
 * payload — no fetch, no 404.
 *
 * The `.where({_extension:'md'})` filter existed to stop a co-located binary
 * asset (e.g. a `.jpg`/`.gif` screenshot sitting next to the `.md`) from
 * shadowing the article — those extensions sort BEFORE `.md` by `_id`, so a
 * path findOne would return the binary. We handle that rare case with a
 * fallback: if the path findOne returns a binary, re-query filtered to `.md`.
 * The fallback only runs for those collision cases (`.jpg`/`.gif`), so the
 * common case stays payload-cached.
 */
export async function findOneContentDoc<T = any>(fullPath: string): Promise<T | null> {
  const doc: any = await queryContent(fullPath).findOne()
  if (doc && doc._type === 'binary') {
    // A binary asset (image/video) won the path lookup — fall back to the
    // markdown document. Only triggers for co-located binaries whose
    // extension sorts before ".md".
    return (await queryContent(fullPath).where({ _extension: 'md' }).findOne()) as T
  }
  return doc as T
}
