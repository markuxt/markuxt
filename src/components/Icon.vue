<script setup lang="ts">
import { computed } from 'vue'

// Import only the icons we need from IconPark
import ArrowLeft from '@icon-park/vue-next/lib/icons/ArrowLeft'
import Mail from '@icon-park/vue-next/lib/icons/Mail'
import Google from '@icon-park/vue-next/lib/icons/Google'
import Search from '@icon-park/vue-next/lib/icons/Search'
import FileStaff from '@icon-park/vue-next/lib/icons/FileStaff'
import Close from '@icon-park/vue-next/lib/icons/Close'
import HamburgerButton from '@icon-park/vue-next/lib/icons/HamburgerButton'
import Help from '@icon-park/vue-next/lib/icons/Help'
import LinkOut from '@icon-park/vue-next/lib/icons/LinkOut'

interface Props {
  name: string
  size?: number | string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
  color: 'currentColor'
})

const iconMap: Record<string, any> = {
  'arrow-left': ArrowLeft,
  'email': Mail,
  'google-scholar': Google,
  'scholar': Google,
  'research': Search,
  'about': FileStaff,
  'close': Close,
  'menu': HamburgerButton,
  'question-mark': Help,
  'external-link': LinkOut
}

const IconComp = computed(() => iconMap[props.name] || null)

// Calculate stroke-width based on icon size for optimal visual weight
// Email icon gets bolder stroke for better visibility
const strokeWidth = computed(() => {
  const isEmail = props.name === 'email'
  if (typeof props.size === 'string') return isEmail ? 3 : 2
  if (isEmail) {
    // Email icon is always bolder
    if (props.size <= 14) return 4
    if (props.size <= 18) return 3.5
    return 3
  }
  // Standard stroke width for other icons (increased for stronger weight)
  if (props.size <= 14) return 3
  if (props.size <= 18) return 2.5
  return 2
})

// Handle both numeric (px) and string (CSS) sizes
const numericSize = computed(() => typeof props.size === 'number' ? props.size : 20)
</script>

<template>
  <!-- Icon wrapper with proper flex centering -->
  <span class="icon-container">
    <!-- For Vue components with numeric size -->
    <component
      v-if="IconComp && typeof size === 'number'"
      :is="IconComp"
      theme="outline"
      :size="numericSize"
      :fill="color || 'currentColor'"
      :stroke-width="strokeWidth"
      class="icon-component"
    />

    <!-- For CSS sizing (container-relative) -->
    <span
      v-else-if="IconComp"
      class="icon-scaled-wrapper"
    >
      <component
        :is="IconComp"
        theme="outline"
        :size="24"
        :fill="color || 'currentColor'"
        :stroke-width="name === 'email' ? 3 : 1.5"
        class="icon-scaled"
      />
    </span>

    <!-- Fallback to Iconify CDN if icon name not recognised -->
    <!-- <img
      v-else
      :src="`https://api.iconify.design/ep-icon-park-outline/${props.name}.svg`"
      :alt="`${props.name} icon`"
      loading="lazy"
      class="icon-fallback"
    /> -->
  </span>
</template>

<style scoped>
.icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  flex-shrink: 0;
}

.icon-component {
  display: block;
  line-height: 1;
}

.icon-scaled-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.icon-scaled,
.icon-fallback {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}
</style>
