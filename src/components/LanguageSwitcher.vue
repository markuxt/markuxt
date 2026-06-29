<template>
  <div class="lang-switcher">
    <button
      v-for="loc in displayLocales"
      :key="loc.code"
      class="lang-switcher__btn"
      :class="{ 'lang-switcher__btn--active': loc.code === currentLocale, 'lang-switcher__btn--placeholder': !loc.code }"
      :disabled="!loc.code"
      @click="loc.code && switchLocale(loc.code)"
    >
      <span v-if="loc.name">{{ loc.name }}</span>
      <span v-else class="lang-switcher__btn-text">...</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// Read the locale from the GLOBAL i18n instance rather than `useI18n()`.
// On static hosting with `no_prefix`, the local composer that `useI18n()`
// returns doesn't inherit the client-applied locale reliably — its `locale`
// ref stays at the prerendered default while the global (which `t()` falls
// back to) has switched. `nuxtApp.$i18n` is the global instance, so the
// switcher's active state matches the locale actually being rendered.

// Safely get i18n instance - may not be available during SSR
let i18n: any = null
try {
  i18n = useNuxtApp().$i18n as {
    locale: { value: string }
    locales: { value: Array<{ code: string; name: string }> }
    setLocale: (code: string) => void
  }
} catch {
  // i18n not available during SSR
}

const availableLocales = computed(() => i18n?.locales?.value ?? [])
const currentLocale = computed(() => i18n?.locale?.value ?? '')

// Display locales: show available if loaded, otherwise show 2 placeholder buttons
const displayLocales = computed(() => {
  if (availableLocales.value.length >= 2) {
    return availableLocales.value
  }
  // Always show at least 2 buttons to prevent layout shift during loading
  // Placeholder buttons have the same structure but no code
  return availableLocales.value.length > 0
    ? [...availableLocales.value, { code: '', name: null }]
    : [{ code: '', name: null }, { code: '', name: null }]
})

function switchLocale(code: string) {
  if (i18n?.setLocale) {
    i18n.setLocale(code)
  }
}
</script>

<style scoped>
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--surface-frosted);
  border-radius: var(--radius-full);
  padding: 2px 3px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.lang-switcher__btn {
  padding: 4px 10px 6px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  height: 26px;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.lang-switcher__btn:hover {
  color: var(--color-text);
}

.lang-switcher__btn--active {
  background: var(--color-secondary);
  color: var(--color-on-secondary);
}

.lang-switcher__btn--active:hover {
  background: var(--surface-brand);
  color: var(--color-on-brand);
}

.lang-switcher__btn--placeholder {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
