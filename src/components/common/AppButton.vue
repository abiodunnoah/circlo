<script setup>
import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: Boolean,
  loading: Boolean,
  block: Boolean,
  type: { type: String, default: 'button' },
})

defineEmits(['click'])

const sizeClasses = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const variantClasses = {
  primary: 'bg-primary-600 text-inverse hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary:
    'bg-card text-fg-2 border border-line hover:bg-line-subtle focus-visible:ring-fg-4',
  danger: 'bg-danger-600 text-inverse hover:bg-danger-700 focus-visible:ring-danger-500',
  success: 'bg-success-600 text-inverse hover:bg-success-700 focus-visible:ring-success-500',
  warning: 'bg-warning-500 text-inverse hover:bg-warning-600 focus-visible:ring-warning-500',
  accent: 'bg-accent-500 text-inverse hover:bg-accent-600 focus-visible:ring-accent-400',
  outline: 'border border-line text-fg-2 hover:bg-line-subtle focus-visible:ring-fg-4',
  'outline-danger':
    'border border-danger-300 text-danger-600 hover:bg-danger-50 focus-visible:ring-danger-500',
  ghost: 'text-fg-3 hover:bg-line focus-visible:ring-fg-4',
}

const classes = computed(() => [
  !(props.disabled || props.loading) && 'cursor-pointer',
  props.block && 'w-full',
  sizeClasses[props.size] || sizeClasses.md,
  variantClasses[props.variant] || variantClasses.primary,
])

const spinnerClass = computed(() => (props.size === 'xs' || props.size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="classes"
    @click="$emit('click', $event)"
  >
    <Loader2 v-if="loading" class="animate-spin -ml-0.5" :class="spinnerClass" />
    <slot />
  </button>
</template>
