<script setup>
defineProps({
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="{
      'bg-green-100 text-green-800': variant === 'approved' || variant === 'paid' || variant === 'received',
      'bg-yellow-100 text-yellow-800': variant === 'pending',
      'bg-red-100 text-red-800': variant === 'rejected' || variant === 'left',
      'bg-slate-100 text-slate-700': variant === 'default',
      'bg-primary-100 text-primary-700': variant === 'active',
      'bg-blue-100 text-blue-700': variant === 'next',
    }"
  >
    <slot />
  </span>
</template>
