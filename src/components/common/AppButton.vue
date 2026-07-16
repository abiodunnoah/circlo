<script setup>
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
        'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
      variant === 'accent' && 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400',
    ]"
    @click="$emit('click', $event)"
  >
    <svg v-if="loading" class="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
