<template>
  <button
    class="color-mode-toggle"
    :aria-label="mode === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')"
    @click="toggle"
  >
    <!-- Sun icon (shown in dark mode — click to switch to light) -->
    <svg v-if="mode === 'dark'" class="color-mode-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
    <!-- Moon icon (shown in light mode — click to switch to dark) -->
    <svg v-else class="color-mode-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'

const { t } = useI18n()

const STORAGE_KEY = 'markuxt-color-mode'

const mode = ref<'light' | 'dark'>('light')
const prefersDark = ref(false)
const hasManualPreference = ref(false)

function toggle() {
  mode.value = mode.value === 'light' ? 'dark' : 'light'
  hasManualPreference.value = true
  localStorage.setItem(STORAGE_KEY, mode.value)
}

onMounted(() => {
  prefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    mode.value = saved
    hasManualPreference.value = true
  } else {
    mode.value = prefersDark.value ? 'dark' : 'light'
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    prefersDark.value = e.matches
    if (!hasManualPreference.value) {
      mode.value = e.matches ? 'dark' : 'light'
    }
  })
})

watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.setAttribute('data-color-mode', mode.value)
  }
})
</script>

<style scoped>
.color-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  background: var(--surface-frosted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-muted);
}

.color-mode-toggle:hover {
  color: var(--color-text);
  background: var(--surface-frosted-strong);
  box-shadow: var(--shadow-md);
}

.color-mode-toggle__icon {
  width: 16px;
  height: 16px;
}
</style>
