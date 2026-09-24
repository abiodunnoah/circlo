<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'full' },
  size: { type: Number, default: 28 },
})

const wordmarkSize = computed(() => Math.round(props.size * 0.6))
</script>

<template>
  <span class="inline-flex items-center gap-2" role="img" aria-label="Circlo">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      class="text-primary-600 shrink-0"
    >
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="currentColor"
        stroke-width="3.4"
        stroke-linecap="round"
        stroke-dasharray="54 15"
        transform="rotate(-108 16 16)"
      />
      <circle cx="16" cy="16" r="4.2" fill="currentColor" />
    </svg>
    <span
      v-if="variant === 'full'"
      class="font-bold tracking-tight text-fg"
      :style="{ fontSize: wordmarkSize + 'px' }"
      >Circlo</span
    >
  </span>
</template>
