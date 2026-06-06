<template>
  <img :src="refinedSrc" :alt="alt" :width="width" :height="height" />
</template>

<script setup lang="ts">
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined }
})

const contentId = inject<Ref<string>>('contentId', ref(''))

const config = useRuntimeConfig()

const refinedSrc = computed(() => {
  try {
    const resolved = resolveContentImage(props.src, unref(contentId))
    if (!resolved) return ''
    const basePath = config.app.baseURL || ''
    if (!basePath || basePath === '/') return resolved
    return basePath.replace(/\/$/, '') + resolved
  } catch {
    // Fallback: return raw src so the page doesn't break
    return props.src || ''
  }
})
</script>
