<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  label: { type: String, default: '' },
  showValue: { type: Boolean, default: false },
})

const pct = computed(() => {
  if (!props.max || props.max <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((props.value / props.max) * 100)))
})

const barClass = computed(
  () =>
    ({
      primary: 'bg-primary-600',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-info-500',
      accent: 'bg-accent-500',
    })[props.variant] || 'bg-primary-600',
)

const heightClass = computed(() => ({ sm: 'h-1.5', md: 'h-2', lg: 'h-3' })[props.size] || 'h-2')
</script>

<template>
  <div>
    <div v-if="label || showValue" class="flex items-center justify-between mb-1.5">
      <span v-if="label" class="text-xs font-medium text-muted">{{ label }}</span>
      <span v-if="showValue" class="text-xs font-semibold text-fg-2 tabular-nums">
        {{ value }}/{{ max }}
      </span>
    </div>
    <div
      class="w-full bg-line rounded-full overflow-hidden"
      :class="heightClass"
      role="progressbar"
      :aria-valuenow="value"
      aria-valuemin="0"
      :aria-valuemax="max"
      :aria-label="label || undefined"
    >
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="barClass"
        :style="{ width: pct + '%' }"
      />
    </div>
  </div>
</template>
