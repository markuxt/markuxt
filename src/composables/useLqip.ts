/**
 * LQIP manifest lookup.
 *
 * `generateLqipManifest` (build:before) writes `/_markuxt/lqip.json` mapping
 * each raster image's public URL → `{ lqip, w, h }`. `useLqip(src)` resolves a
 * runtime `<img src>` against that manifest.
 *
 * Fetch strategy: the manifest is fetched once (deduped) into `useState` and is
 * triggered from the client on every `<ProgressiveImage>` setup. We deliberately
 * do NOT use `useFetch`/`useAsyncData` here: on static hosting the SSR-time
 * fetch of a public asset is unreliable, and when SSR returns null those
 * composables serialize null into the payload and the client never refetches —
 * so placeholders would never appear. Fetching into `useState` on the client
 * guarantees the manifest loads post-hydration regardless of the SSR outcome,
 * and every image reactively picks up its placeholder as soon as it arrives.
 */
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import type { LqipManifest, LqipEntry } from '../build/generate-lqip'

const STATE_KEY = 'markuxt:lqip-manifest'
let inflight: Promise<void> | null = null

function manifestUrl(): string {
  const base = (useRuntimeConfig().app as { baseURL?: string }).baseURL || '/'
  return (base.endsWith('/') ? base : base + '/') + '_markuxt/lqip.json'
}

/** Fetch the manifest once (deduped across all callers) into useState. */
function ensureManifest(): Promise<void> {
  const state = useState<LqipManifest | null>(STATE_KEY, () => null)
  if (state.value || inflight) return inflight ?? Promise.resolve()
  inflight = (async () => {
    try {
      state.value = (await $fetch(manifestUrl())) as LqipManifest
    } catch {
      // Missing/unreachable manifest (e.g. sharp skipped) → degrade silently.
      state.value = null
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/** Normalize a runtime src to the manifest key format (or '' if unresolvable). */
function normalizeSrc(src: string): string {
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return ''
  let s = src
  const base = (useRuntimeConfig().app as { baseURL?: string }).baseURL
  if (base && base !== '/' && s.startsWith(base)) s = s.slice(base.length)
  s = s.split('?')[0].split('#')[0]
  if (!s.startsWith('/')) s = '/' + s
  return s
}

/**
 * Resolve the LQIP entry for a reactive src.
 * Returns `{ lqip, w, h }` or `null` when the manifest is unavailable / the src
 * isn't in it (external URLs, SVGs, data URIs).
 */
export function useLqip(src: MaybeRefOrGetter<string>) {
  // Kick off the (deduped) client fetch. SSR renders the neutral shimmer
  // fallback; the placeholder appears the moment the manifest lands.
  if (import.meta.client) ensureManifest()

  const state = useState<LqipManifest | null>(STATE_KEY, () => null)
  return computed<LqipEntry | null>(() => {
    const manifest = state.value
    if (!manifest) return null
    return manifest[normalizeSrc(toValue(src))] || null
  })
}
