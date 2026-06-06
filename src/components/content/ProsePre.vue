<template>
  <!-- Mermaid blocks are diagrams, not code: hand off to the renderer. -->
  <MermaidDiagram v-if="language === 'mermaid'" :code="code" />

  <!-- Everything else: a highlighted code block with chrome. -->
  <div v-else class="code-block">
    <div class="code-block__header">
      <span class="code-block__lang">{{ displayLanguage }}</span>
      <button
        type="button"
        class="code-block__copy"
        :class="{ 'is-copied': copied }"
        :aria-label="copied ? t('code.copied') : t('code.copyCode')"
        :title="copied ? t('code.copiedExclaim') : t('code.copy')"
        @click="copyCode"
      >
        <Check v-if="copied" theme="outline" :size="16" :stroke-width="3" />
        <Copy v-else theme="outline" :size="16" :stroke-width="3" />
      </button>
    </div>
    <pre :class="$props.class"><slot /></pre>
  </div>
</template>

<script setup lang="ts">
import Copy from '@icon-park/vue-next/es/icons/Copy'
import Check from '@icon-park/vue-next/es/icons/Check'

const { t } = useI18n()

const props = defineProps({
  code: { type: String, default: '' },
  language: { type: String, default: null },
  filename: { type: String, default: null },
  highlights: { type: Array as () => number[], default: () => [] },
  meta: { type: String, default: null },
  class: { type: String, default: null }
})

const copied = ref(false)

// Friendly label for the header; fall back to "text" for fenced blocks
// that declared no language.
const displayLanguage = computed(() => {
  if (props.filename) return props.filename
  return props.language || 'text'
})

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('[ProsePre] copy failed:', err)
  }
}
</script>
