/**
 * Fetch a single content document by its `_path`, payload-cached (no 404 on
 * refresh). Uses a plain path-based findOne (NO .where filter — filtered
 * queries produce a different query hash on the client vs server on static
 * hosting, causing 404 on refresh).
 *
 * Returns the first variant by _id (usually the default-locale file).
 * Locale-variant picking (zh vs en) requires a filtered query which isn't
 * reliably payload-cached under `no_prefix` + static — a known limitation.
 * The content-locale plugin still tags `file.locale` correctly for future
 * use (e.g. if the site switches to `strategy: 'prefix'` where Nuxt Content
 * natively resolves locale variants).
 *
 * The binary-asset fallback (co-located .jpg screenshot) is preserved.
 */
export async function findOneContentDoc<T = any>(
  fullPath: string,
  _locale?: string,
  _defaultLocale?: string,
): Promise<T | null> {
  const doc: any = await queryContent(fullPath).findOne()

  if (doc && doc._type === 'binary') {
    // A binary asset won the path lookup — fall back to the .md document.
    return await queryContent(fullPath).where({ _extension: 'md' }).findOne().catch(() => null) as T
  }
  return (doc as T) ?? null
}
