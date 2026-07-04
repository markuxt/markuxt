<template>
  <!--
    Progressive (blur-up) image.

    Shows a blurred LQIP thumbnail instantly (from the build-time manifest via
    useLqip), then lazy-loads the full image on top and fades it in. The real
    image's intrinsic dimensions come from the manifest and are bound as
    width/height attrs, which reserves the box (no layout shift) even before
    the bytes arrive.

    Three sizing modes:
      • fill (default) — wrapper is width:100%/height:100% + object-fit cover,
                          for images inside an already-sized container (cards,
                          carousel). Pass the original img class via `img-class`
                          so object-fit / hover transforms keep working.
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
    :class="[wrapperClass, modeClass, { 'prog-img--loaded': loaded, 'prog-img--error': error }]"
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
      :class="imgClass"
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
  lazy: { type: Boolean, default: true },
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg-alt, #e9e9ec);
}

/* fluid: full-width, height from the image's own aspect ratio. */
.prog-img--fluid {
  height: auto;
}
.prog-img--fluid .prog-img__img {
  height: auto;
}

/* natural: inline-block, shrinks to the image's natural size. */
.prog-img--natural {
  display: inline-block;
  width: auto;
  height: auto;
  vertical-align: middle;
}
.prog-img--natural .prog-img__img {
  width: auto;
  max-width: 100%;
  height: auto;
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
  width: 100%;
  height: 100%;
  object-fit: cover;
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
