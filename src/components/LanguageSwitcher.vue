<template>
  <div class="lang-switcher">
    <button
      v-for="loc in availableLocales"
      :key="loc.code"
      class="lang-switcher__btn"
      :class="{ 'lang-switcher__btn--active': loc.code === locale }"
      @click="setLocale(loc.code as 'en' | 'zh-CN')"
    >
      {{ getLocaleLabel(loc.code) }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>)
)

const LABELS: Record<string, string> = {
  'en': 'EN',
  'zh-CN': '中文',
}

function getLocaleLabel(code: string): string {
  if (code in LABELS) return LABELS[code]
  console.warn(`[LanguageSwitcher] unknown locale code: "${code}"`)
  return code
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
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
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
</style>
