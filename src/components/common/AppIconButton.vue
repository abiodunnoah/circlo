<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md' },
  variant: { type: String, default: 'ghost' },
  label: { type: String, default: '' },
  badge: { type: [Number, String], default: 0 },
})

defineEmits(['click'])

const sizeClass = computed(
  () => ({ sm: 'p-1.5', md: 'p-2', lg: 'p-2.5' })[props.size] || 'p-2',
)

const variantClass = computed(
  () =>
    ({
      ghost: 'text-fg-3 hover:bg-line hover:text-fg',
      soft: 'bg-line-subtle text-fg-2 hover:bg-line',
      outline: 'border border-line text-fg-2 hover:bg-line-subtle',
    })[props.variant] || 'text-fg-3 hover:bg-line hover:text-fg',
)
</script>

<template>
  <button
    type="button"
    class="relative inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[sizeClass, variantClass]"
    :aria-label="label || undefined"
    @click="$emit('click', $event)"
  >
    <slot />
    <span
      v-if="badge"
      class="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-inverse flex items-center justify-center leading-none"
    >
      {{ badge }}
    </span>
  </button>
</template>
