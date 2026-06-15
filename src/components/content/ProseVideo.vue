<template>
  <video
    :src="refinedSrc"
    :controls="controls"
    :autoplay="autoplay"
    :loop="loop"
    :muted="muted"
    :poster="refinedPoster"
    :width="width"
    :height="height"
  >
    <slot />
  </video>
</template>

<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  poster: { type: String, default: undefined },
  controls: { type: [Boolean, String], default: true },
  autoplay: { type: [Boolean, String], default: false },
  loop: { type: [Boolean, String], default: false },
  muted: { type: [Boolean, String], default: false },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined }
})

// Injected by the page component via provide('contentId', ...)
const contentId = inject<Ref<string>>('contentId', { value: '' } as Ref<string>)

const config = useRuntimeConfig()

function resolve(src?: string): string | undefined {
  if (!src) return src
  const resolved = resolveContentImage(src, contentId.value)
  const basePath = (config.app as { baseURL?: string }).baseURL || '/'
  if (!basePath || basePath === '/' || resolved.startsWith(basePath)) return resolved
  return basePath.replace(/\/$/, '') + resolved
}

const refinedSrc = computed(() => resolve(props.src))
const refinedPoster = computed(() => resolve(props.poster))
</script>
