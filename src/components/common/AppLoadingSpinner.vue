<script setup>
import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'

const props = defineProps({
  size: { type: String, default: 'md' },
  label: { type: String, default: '' },
})

const sizeClass = computed(
  () => ({ sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' })[props.size] || 'w-6 h-6',
)
</script>

<template>
  <span class="inline-flex items-center gap-2 text-muted" role="status">
    <Loader2 class="animate-spin" :class="sizeClass" />
    <span v-if="label" class="text-sm">{{ label }}</span>
    <span v-else class="sr-only">Loading</span>
  </span>
</template>
