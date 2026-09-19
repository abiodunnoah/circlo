<script setup>
import { Loader2 } from '@lucide/vue'

defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: Boolean,
  loading: Boolean,
  type: { type: String, default: 'button' },
})

defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      !(disabled || loading) && 'cursor-pointer',
      size === 'sm' && 'px-3 py-1.5 text-sm',
      size === 'md' && 'px-4 py-2 text-sm',
      size === 'lg' && 'px-6 py-3 text-base',
      variant === 'primary' &&
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      variant === 'secondary' &&
        'bg-card text-fg-2 border border-line hover:bg-line-subtle focus:ring-fg-4',
      variant === 'danger' && 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
      variant === 'success' && 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
      variant === 'ghost' && 'text-fg-3 hover:bg-line focus:ring-fg-4',
      variant === 'accent' && 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400',
    ]"
    @click="$emit('click', $event)"
  >
    <Loader2 v-if="loading" class="animate-spin -ml-1 h-4 w-4" />
    <slot />
  </button>
</template>
