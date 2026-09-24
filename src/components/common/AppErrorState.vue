<script setup>
import { AlertTriangle } from '@lucide/vue'
import AppButton from './AppButton.vue'

defineProps({
  title: { type: String, default: 'Something went wrong' },
  message: { type: String, default: '' },
  retryLabel: { type: String, default: 'Try again' },
  retryable: { type: Boolean, default: true },
})

defineEmits(['retry'])
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div
      class="w-14 h-14 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center mb-4"
    >
      <AlertTriangle class="w-7 h-7" />
    </div>
    <h3 class="text-base font-semibold text-fg">{{ title }}</h3>
    <p v-if="message" class="text-sm text-muted mt-1 max-w-xs break-words">{{ message }}</p>
    <div v-if="$slots.action || retryable" class="mt-4">
      <slot name="action">
        <AppButton variant="secondary" @click="$emit('retry')">{{ retryLabel }}</AppButton>
      </slot>
    </div>
  </div>
</template>
