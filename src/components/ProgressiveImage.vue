<template>
  <!--
    Progressive (blur-up) image — a PASSIVE renderer.

    Shows a blurred LQIP thumbnail instantly (from the build-time manifest via
    useLqip), then lazy-loads the full image on top and fades it in. The real
    image's intrinsic dimensions come from the manifest and are bound as
    width/height attrs, which reserves the box (no layout shift) even before the
    bytes arrive.

    By default this component imposes NO size of its own — the <img> renders at
    its natural size, responsive (max-width:100%, height:auto), like a plain
    <img>. Sizing/fit is opt-in so the CONSUMER stays in control of layout:

      • mode="fill"   — fill the parent box (width/height 100%) + object-fit
                         (via `fit`). Cards/carousel opt into this explicitly.
      • mode="fluid"  — full-width responsive (width 100%, height auto).
      • limitSize     — (markdown) cap the image to the viewport height, center
                         it, and let it keep its natural size. The ONLY size
                         restriction ProgressiveImage applies, and only when an
                         explicit consumer (ProseImg) opts in.

    No-JS safe: the <img> is visible by default; the fade-in is gated on a `.js`
    class an inline head script sets, so without JS the image still paints.
  -->
  <div
    class="prog-img"
    :class="[wrapperClass, modeClass, { 'prog-img--loaded': loaded, 'prog-img--error': error, 'prog-img--borderless': !bordered, 'prog-img--transparent': transparent, 'prog-img--limit': limitSize }]"
  >
    <div
      v-if="placeholder && !error"
      class="prog-img__placeholder"
      :style="{ backgroundImage: `url(${placeholder})` }"
      aria-hidden="true"
    ></div>
    <div
      v-else-if="!loaded && !error"
      class="prog-img__shimmer"
      aria-hidden="true"
    ></div>
    <img
      ref="imgRef"
      :src="src"
      :alt="alt"
      :width="imgWidth"
      :height="imgHeight"
      :loading="lazy ? 'lazy' : 'eager'"
      decoding="async"
      class="prog-img__img"
      :class="[imgClass, `prog-img__img--${fit}`]"
      @load="loaded = true"
      @error="loaded = true, error = true"
    />
  </div>
</template>

<script setup lang="ts">
type Mode = 'natural' | 'fill' | 'fluid'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  /** Class applied to the real <img> (preserves hover transforms). */
  imgClass: { type: String, default: '' },
  /** Extra class on the wrapper .prog-img. */
  wrapperClass: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
  /** Sizing mode. Defaults to `natural` (passive — natural size, responsive;
   *  the component imposes no box). `fill` fills the parent box (+ object-fit
   *  via `fit`); `fluid` is full-width responsive. */
  mode: { type: String as () => Mode, default: 'natural' },
  /** object-fit for `fill` mode. `contain` (default) shows the whole image;
   *  `cover` crops to fill. */
  fit: { type: String as () => 'cover' | 'contain', default: 'contain' },
  lazy: { type: Boolean, default: true },
  /** Draw the 1px frame (default on). Turn off when the container frames it. */
  bordered: { type: Boolean, default: true },
  /** Transparent wrapper so a parent's own backdrop shows through. */
  transparent: { type: Boolean, default: false },
  /** MARKDOWN opt-in: cap the image to the viewport height, center it, keep its
   *  natural size. The only size restriction this component applies, and only
   *  when a consumer (ProseImg) explicitly opts in — cards/detail images are
   *  never subject to it. */
  limitSize: { type: Boolean, default: false },
})

const entry = useLqip(toRef(props, 'src'))
const placeholder = computed(() => entry.value?.lqip || '')

const loaded = ref(false)
const error = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

// Intrinsic dimensions: explicit props win, else the manifest's measured size.
// Bound as width/height attrs so the box is reserved before load (no CLS) and
// fluid/natural modes can derive height from the aspect ratio.
const imgWidth = computed(() => props.width ?? entry.value?.w)
const imgHeight = computed(() => props.height ?? entry.value?.h)

const modeClass = computed(() => `prog-img--${props.mode}`)

// If the image is already complete by the time we check (cached, or decoded
// before Vue attached its @load listener), the `load` event will never fire —
// so flip `loaded` manually. Without this, fast/cached images stay hidden.
function syncLoaded() {
  const el = imgRef.value
  if (el && el.complete && el.naturalWidth > 0) {
    loaded.value = true
  }
}
onMounted(syncLoaded)

// Reset reveal state if the src swaps (e.g. dynamic content), then re-check in
// case the new src is already cached.
watch(
  () => props.src,
  async () => {
    loaded.value = false
    error.value = false
    await nextTick()
    syncLoaded()
  },
)
</script>

<style scoped>
.prog-img {
  position: relative;
  /* PASSIVE by default: shrink-wraps the image (inline-block, natural size,
     responsive). The component imposes NO box/fit — consumers opt in via `mode`
     (fill/fluid) or override via :deep. Keeping the base low-specificity
     (0,2,0) means a consumer's :deep (0,3,0) always wins. */
  display: inline-block;
  max-width: 100%;
  width: auto;
  height: auto;
  vertical-align: middle;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--color-bg-alt, #e9e9ec);
  border: 1px solid var(--color-border, #e2e2e7);
}

/* Opt out of the frame (e.g. when the card already provides its own). */
.prog-img--borderless {
  border: none;
}

/* fill: explicit opt-in — fill the parent box (width/height 100%). */
.prog-img--fill {
  display: block;
  width: 100%;
  height: 100%;
}
.prog-img--fill .prog-img__img {
  width: 100%;
  height: 100%;
}

/* fluid: full-width responsive (width 100%, height from the image's own ratio). */
.prog-img--fluid {
  display: block;
  width: 100%;
  height: auto;
}
.prog-img--fluid .prog-img__img {
  width: 100%;
  height: auto;
}

/* natural (DEFAULT): passive — uses the base styles above (no override needed). */

/* limitSize: MARKDOWN opt-in (ProseImg) — the only size restriction this
   component applies: cap to viewport height, center, keep natural size. Only
   the explicit consumer that sets `limitSize` is affected. Markdown images are
   also the only ones that get the rounded corners. */
.prog-img--limit {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin-inline: auto;
  border-radius: var(--radius-md);
}
.prog-img--limit .prog-img__img {
  max-height: 100vh;
}

/* Blurred low-res placeholder. Inset + scale hide the blur's transparent edge. */
.prog-img__placeholder {
  position: absolute;
  inset: -2px;
  z-index: 0;
  background-size: cover;
  background-position: center;
  filter: blur(20px) saturate(1.15);
  transform: scale(1.08);
  transition: opacity 0.45s ease;
}

/* Neutral shimmer when no LQIP is available (external/SVG/missing). */
.prog-img__shimmer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    90deg,
    var(--color-bg-alt, #e9e9ec),
    var(--color-bg, #f4f4f6),
    var(--color-bg-alt, #e9e9ec)
  );
  background-size: 200% 100%;
  animation: progShimmer 1.3s ease-in-out infinite;
  transition: opacity 0.45s ease;
}

.prog-img__img {
  position: relative;
  z-index: 1;
  display: block;
  max-width: 100%;
  width: auto;
  height: auto;
}

/* object-fit is applied via a modifier class (set from the `fit` prop) so it
 * reliably wins over any consumer img-class (which lives in a different scope
 * and wouldn't otherwise reach this <img>). Only meaningful in fill mode. */
.prog-img__img--contain {
  object-fit: contain;
}

.prog-img__img--cover {
  object-fit: cover;
}

/* Let a parent's own background (e.g. the carousel gradient) show through
 * around a contained image, instead of the wrapper's neutral fill. */
.prog-img--transparent {
  background: transparent;
}

/* In transparent mode the parent supplies the backdrop, so suppress both
 * fallback layers — the shimmer, AND the blurred LQIP placeholder (which is
 * background-size:cover and would otherwise fill the box, re-covering the
 * parent gradient). The real <img> (contain) still fades in on load. */
.prog-img--transparent .prog-img__shimmer,
.prog-img--transparent .prog-img__placeholder {
  display: none;
}

/*
 * Fade-in is JS-gated (`.js` on <html> from an inline head script). Without JS
 * the image stays visible (opacity defaults to 1). Use an animation (not
 * `transition`) so we don't clobber consumer transitions like card hover scale.
 */
.js .prog-img__img {
  opacity: 0;
}

.js .prog-img--loaded .prog-img__img {
  animation: progFadeIn 0.45s ease forwards;
}

.prog-img--loaded .prog-img__placeholder,
.prog-img--loaded .prog-img__shimmer {
  opacity: 0;
}

@keyframes progFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes progShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .js .prog-img__img,
  .js .prog-img--loaded .prog-img__img {
    animation: none;
    opacity: 1;
  }
  .prog-img__shimmer {
    animation: none;
  }
  .prog-img__placeholder,
  .prog-img__shimmer {
    transition: none;
  }
}
</style>
