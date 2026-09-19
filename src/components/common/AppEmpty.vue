<script setup>
import { Inbox } from '@lucide/vue'

defineProps({
  title: { type: String, default: 'Nothing here yet' },
  description: String,
  actionLabel: String,
})

defineEmits(['action'])
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 bg-line rounded-full flex items-center justify-center mb-4">
      <Inbox class="w-8 h-8 text-fg-4" />
    </div>
    <h3 class="text-base font-semibold text-fg mb-1">{{ title }}</h3>
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
