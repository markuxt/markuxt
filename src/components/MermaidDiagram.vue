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
let observer: MutationObserver | null = null
let media: MediaQueryList | null = null

// A unique id per diagram avoids mermaid's internal id collisions when
// multiple diagrams render on the same page.
const renderId = `mermaid-${Math.random().toString(36).slice(2, 10)}`

async function renderDiagram() {
  if (!props.code) return
  try {
    // Wait for fonts so mermaid measures text correctly
    await document.fonts.ready
    const styles = getComputedStyle(document.documentElement)
    const readVar = (name: string) => styles.getPropertyValue(name).trim()

    const mermaid = (await import('mermaid')).default
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'var(--font-body), sans-serif',
      htmlLabels: true,
      themeVariables: {
        primaryColor: readVar('--mermaid-node-bg'),
        primaryBorderColor: readVar('--mermaid-node-border'),
        primaryTextColor: readVar('--mermaid-node-text'),
        lineColor: readVar('--mermaid-line'),
        fontSize: '15px',
      },
      flowchart: {
        htmlLabels: true,
        useMaxWidth: false,
        padding: 18,
      },
    })
    const { svg: rendered } = await mermaid.render(renderId, props.code)
    svg.value = rendered
  } catch (err) {
    console.error('[MermaidDiagram] render failed:', err)
  }
}

// Mermaid touches the DOM, so only run in the browser after mount.
onMounted(() => {
  renderDiagram()

  const root = document.documentElement
  observer = new MutationObserver(() => {
    renderDiagram()
  })

  observer.observe(root, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-color-mode'],
  })

  media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', handleSchemeChange)
})

watch(() => props.code, renderDiagram)

const handleSchemeChange = () => renderDiagram()

onBeforeUnmount(() => {
  observer?.disconnect()
  media?.removeEventListener('change', handleSchemeChange)
})
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
  height: auto;
}

/* Prevent text clipping inside mermaid nodes */
.mermaid-diagram__svg :deep(.node) {
  overflow: visible;
}

.mermaid-diagram__svg :deep(.node rect),
.mermaid-diagram__svg :deep(.node polygon),
.mermaid-diagram__svg :deep(.node circle) {
  overflow: visible;
}

.mermaid-diagram__svg :deep(.nodeLabel) {
  overflow: visible;
  white-space: nowrap;
}

.mermaid-diagram__svg :deep(foreignObject) {
  overflow: visible;
}

.mermaid-diagram__source {
  margin: 0;
  text-align: left;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  white-space: pre-wrap;
}
</style>
