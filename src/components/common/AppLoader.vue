<script setup>
defineProps({
  size: { type: String, default: 'md' },
  text: String,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 gap-3">
    <svg
      class="animate-spin text-primary-600"
      :class="size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <p v-if="text" class="text-sm text-muted">{{ text }}</p>
  </div>
</template>
