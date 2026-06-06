<template>
  <div class="mermaid-diagram">
    <!-- Rendered SVG is injected here once mermaid resolves on the client -->
    <div v-if="svg" class="mermaid-diagram__svg" v-html="svg" />
    <!-- Fallback: show the raw source until hydration renders the diagram -->
    <pre v-else class="mermaid-diagram__source"><code>{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ code: string }>()

const svg = ref('')

// A unique id per diagram avoids mermaid's internal id collisions when
// multiple diagrams render on the same page.
const renderId = `mermaid-${Math.random().toString(36).slice(2, 10)}`

async function renderDiagram() {
  if (!props.code) return
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'var(--font-body), sans-serif',
      themeVariables: {
        primaryColor: '#e6f7fb',
        primaryBorderColor: '#009bc1',
        primaryTextColor: '#0a2540',
        lineColor: '#64748b',
        fontSize: '15px'
      }
    })
    const { svg: rendered } = await mermaid.render(renderId, props.code)
    svg.value = rendered
  } catch (err) {
    console.error('[MermaidDiagram] render failed:', err)
  }
}

// Mermaid touches the DOM, so only run in the browser after mount.
onMounted(renderDiagram)
watch(() => props.code, renderDiagram)
</script>

<style scoped>
.mermaid-diagram {
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-lg);
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  text-align: center;
}

.mermaid-diagram__svg :deep(svg) {
  max-width: 100%;
  height: auto;
}

.mermaid-diagram__source {
  margin: 0;
  text-align: left;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  white-space: pre-wrap;
}
</style>
