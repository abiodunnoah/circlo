<script setup>
import { computed } from 'vue'
import { formatNaira } from '@/utils/format'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  size: { type: String, default: 'md' },
  muted: { type: Boolean, default: false },
})

const sizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl sm:text-4xl',
}

const formatted = computed(() => formatNaira(Number(props.value) || 0))
const sizeClass = computed(() => sizes[props.size] || sizes.md)
</script>

<template>
  <span
    class="tabular-nums font-bold"
    :class="[sizeClass, muted ? 'text-muted' : 'text-fg']"
    >{{ formatted }}</span
  >
</template>
