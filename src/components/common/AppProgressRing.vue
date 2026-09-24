<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: Number, default: 120 },
  stroke: { type: Number, default: 10 },
  variant: { type: String, default: 'primary' },
  label: { type: String, default: '' },
})

const colorClass = computed(
  () =>
    ({
      primary: 'text-primary-600',
      success: 'text-success-500',
      warning: 'text-warning-500',
      danger: 'text-danger-500',
      info: 'text-info-500',
    })[props.variant] || 'text-primary-600',
)

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const pct = computed(() => (props.max <= 0 ? 0 : Math.max(0, Math.min(1, props.value / props.max))))
const dash = computed(() => `${circumference.value * pct.value} ${circumference.value}`)
const center = computed(() => props.size / 2)
</script>

<template>
  <div class="relative inline-flex items-center justify-center" :style="{ width: size + 'px', height: size + 'px' }">
    <svg
      :width="size"
      :height="size"
      class="-rotate-90"
      role="progressbar"
      aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="value"
      :aria-label="label || undefined"
    >
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="currentColor"
        class="text-line"
        :stroke-width="stroke"
      />
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="currentColor"
        :class="colorClass"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="dash"
        class="transition-all duration-500 ease-out"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
      <slot />
    </div>
  </div>
</template>
