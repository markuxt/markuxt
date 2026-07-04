<template>
  <!--
    Progressive (blur-up) image.

    Shows a blurred LQIP thumbnail instantly (from the build-time manifest via
    useLqip), then lazy-loads the full image on top and fades it in. The real
    image's intrinsic dimensions come from the manifest and are bound as
    width/height attrs, which reserves the box (no layout shift) even before
    the bytes arrive.

    Three sizing modes:
      • fill (default) — wrapper is width:100%/height:100% + object-fit
                          contain (whole image shown, no truncation), for images
                          inside an already-sized container (cards, carousel).
                          Pass the original img class via `img-class` so hover
                          transforms keep working.
      • fluid          — wrapper width:100%, height driven by the image's own
                          aspect ratio (full-width responsive: detail headers,
                          screenshots, the 180px profile photo).
      • natural        — inline-block wrapper that shrinks to the image's natural
                          size (max-width:100%), for free-flowing prose images.

    No-JS safe: the <img> is visible by default; the fade-in is gated on a `.js`
    class an inline head script sets, so without JS the image still paints.
  -->
  <div
    class="prog-img"
    :class="[wrapperClass, modeClass, { 'prog-img--loaded': loaded, 'prog-img--error': error, 'prog-img--borderless': !bordered, 'prog-img--transparent': transparent }]"
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
type Mode = 'fill' | 'fluid' | 'natural'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  /** Class applied to the real <img> (preserves object-fit / hover transforms). */
  imgClass: { type: String, default: '' },
  /** Extra class on the wrapper .prog-img. */
  wrapperClass: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
  mode: { type: String as () => Mode, default: 'fill' },
  /** object-fit for fill-mode boxes. Defaults to `contain` (whole image, no
   *  truncation). Use `cover` when the box should be filled and cropped (e.g.
   *  MemberCard avatars at a fixed aspect ratio). */
  fit: { type: String as () => 'cover' | 'contain', default: 'contain' },
  lazy: { type: Boolean, default: true },
  /** Draw the 1px frame around the image (default on). Turn off for images
   *  whose container already frames them (e.g. MemberCard avatars). */
  bordered: { type: Boolean, default: true },
  /** Make the wrapper background transparent so a parent's own background (e.g.
   *  the carousel gradient) shows through around a contained image. */
  transparent: { type: Boolean, default: false },
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
  display: block;
  /* Never exceed the container; works on mobile + desktop. box-sizing keeps
     the border inside the declared width so it can't cause overflow. */
  max-width: 100%;
  max-height: 100vh;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--color-bg-alt, #e9e9ec);
  /* Frame every image. */
  border: 1px solid var(--color-border, #e2e2e7);
}

/* Opt out of the frame (e.g. when the card already provides its own). */
.prog-img--borderless {
  border: none;
}

/* fluid: shrink-to-fit + centered. The image scales to fit within BOTH the
   container width (max-width:100%) and the viewport height (max-height:100vh),
   preserving aspect ratio — so a tall/square image reduces its width instead
   of being clipped. The wrapper shrink-wraps the image so the border frames
   the picture, not empty side space. */
.prog-img--fluid {
  display: block;
  width: fit-content;
  max-width: 100%;
  height: auto;
  margin-inline: auto;
  border-radius: var(--radius-md);
}
.prog-img--fluid .prog-img__img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100vh;
}

/* natural: shrinks to the image's natural size, capped to the container width
   and the viewport height (same fit-within-both rule), centered horizontally. */
.prog-img--natural {
  display: block;
  width: fit-content;
  max-width: 100%;
  height: auto;
  margin-inline: auto;
  border-radius: var(--radius-md);
}
.prog-img--natural .prog-img__img {
  width: auto;
  height: auto;
  max-width: 100%;
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
  max-height: 100vh;
  width: 100%;
  height: 100%;
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

.prog-img--transparent .prog-img__shimmer {
  background: transparent;
  animation: none;
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
