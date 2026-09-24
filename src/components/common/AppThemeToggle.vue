<script setup>
import { computed } from 'vue'
import { Sun, Moon, Monitor } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import AppIconButton from './AppIconButton.vue'

defineProps({
  variant: { type: String, default: 'icon' },
})

const { mode, setMode, cycleMode } = useTheme()

const modes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const currentIcon = computed(
  () => (modes.find((m) => m.value === mode.value) || modes[2]).icon,
)
const currentLabel = computed(() => (modes.find((m) => m.value === mode.value) || modes[2]).label)
</script>

<template>
  <div v-if="variant === 'segmented'" class="inline-flex gap-1 rounded-lg bg-line p-1">
    <button
      v-for="m in modes"
      :key="m.value"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      :class="mode === m.value ? 'bg-card text-fg shadow-sm' : 'text-fg-3 hover:text-fg'"
      :aria-pressed="mode === m.value"
      @click="setMode(m.value)"
    >
      <component :is="m.icon" class="w-4 h-4" />
      {{ m.label }}
    </button>
  </div>

  <AppIconButton
    v-else
    :label="`Theme: ${currentLabel}. Switch theme`"
    @click="cycleMode"
  >
    <component :is="currentIcon" class="w-5 h-5" />
  </AppIconButton>
</template>
