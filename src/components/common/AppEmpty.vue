<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet' },
  description: String,
  actionLabel: String,
})

defineEmits(['action'])
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </div>
    <h3 class="text-base font-semibold text-slate-900 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-muted mb-4 max-w-xs">{{ description }}</p>
    <button
      v-if="actionLabel"
      class="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
