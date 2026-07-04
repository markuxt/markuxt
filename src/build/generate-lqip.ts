/**
 * Build-time LQIP (Low Quality Image Placeholder) generator.
 *
 * For every raster image under <rootDir>/public/ this produces a tiny (~20px)
 * blurred base64 thumbnail + the image's intrinsic dimensions, and writes them
 * to <rootDir>/public/_markuxt/lqip.json keyed by the image's public URL.
 *
 * At runtime `<ProgressiveImage>` (via `useLqip()`) reads that manifest to show
 * the blurred thumbnail instantly, then cross-fades to the lazy-loaded full
 * image. Dimensions also let us reserve aspect-ratio space (no layout shift).
 *
 * Runs from the markuxt layer's `build:before` hook (after `syncContentAssets`
 * has copied content images into public/_markuxt/). SVG / ICO / non-images are
 * skipped; animated GIFs collapse to their first frame. If `sharp` isn't
 * installed the whole step is skipped gracefully (the site still works, just
 * without blurred placeholders).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, relative, extname, sep } from 'path'

const RASTER = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp', '.tiff', '.tif'])

// Resize so the longest edge is ~20px (keeps aspect). Small enough to inline as
// base64 (~0.3–0.8 KB each), big enough that the blurred-up fill looks smooth.
const THUMB_EDGE = 20
const JPEG_QUALITY = 38
// Cap simultaneous sharp ops. Each reads the source into a Buffer; on content-
// heavy sites (hundreds of images) unbounded concurrency risks heap spikes.
const CONCURRENCY = 8

export interface LqipEntry {
  /** `data:image/jpeg;base64,...` — the blurred placeholder. */
  lqip: string
  /** Intrinsic pixel width of the source image. */
  w: number
  /** Intrinsic pixel height of the source image. */
  h: number
}
export type LqipManifest = Record<string, LqipEntry>

async function pool<T>(items: string[], limit: number, worker: (item: string) => Promise<T>) {
  let i = 0
  const run = async (): Promise<void> => {
    while (i < items.length) {
      const idx = i++
      await worker(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
}

export async function generateLqipManifest(rootDir: string): Promise<void> {
  // `sharp` ships as `export =` (CommonJS). Its type makes the dynamic-import
  // namespace itself callable, but at runtime Node's interop exposes the
  // function as `.default` — so cast to any and accept either shape.
  let sharpFactory: any
  try {
    const mod: any = await import('sharp')
    sharpFactory = mod.default ?? mod
  } catch {
    console.warn(
      '[markuxt-lqip] `sharp` is not installed — skipping LQIP generation. ' +
        'Run `pnpm add sharp` to enable blurred image placeholders.',
    )
    return
  }

  const publicDir = join(rootDir, 'public')
  if (!existsSync(publicDir)) return

  // Collect raster image files (absolute paths).
  const files: string[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile() && RASTER.has(extname(entry.name).toLowerCase())) {
        files.push(full)
      }
    }
  }
  walk(publicDir)
  if (files.length === 0) return

  const manifest: LqipManifest = {}
  let skipped = 0

  await pool(files, CONCURRENCY, async (file) => {
    try {
      const buf = readFileSync(file)
      const meta = await sharpFactory(buf).metadata()
      const thumb = await sharpFactory(buf)
        .resize(THUMB_EDGE, THUMB_EDGE, { fit: 'inside' })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer()
      const url = '/' + relative(publicDir, file).split(sep).join('/')
      manifest[url] = {
        lqip: 'data:image/jpeg;base64,' + thumb.toString('base64'),
        w: meta.width || 0,
        h: meta.height || 0,
      }
    } catch {
      // Unsupported/Corrupt image (e.g. exotic codec) — skip silently.
      skipped++
    }
  })

  const outDir = join(publicDir, '_markuxt')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'lqip.json'), JSON.stringify(manifest))

  console.log(
    `[markuxt-lqip] Generated ${Object.keys(manifest).length} placeholder(s)` +
      (skipped ? `, skipped ${skipped}` : '') +
      ' → public/_markuxt/lqip.json',
  )
}
