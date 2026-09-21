<script setup>
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

defineProps({
  open: Boolean,
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  variant: { type: String, default: 'primary' },
  loading: Boolean,
})

defineEmits(['confirm', 'cancel'])
</script>

<template>
  <AppModal :open="open" :title="title" size="sm" @close="$emit('cancel')">
    <div class="text-sm text-muted">
      <slot>{{ message }}</slot>
    </div>
    <template #footer>
      <AppButton variant="secondary" @click="$emit('cancel')">{{ cancelLabel }}</AppButton>
      <AppButton :variant="variant" :loading="loading" @click="$emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
