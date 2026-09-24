<script setup>
import AppInput from './AppInput.vue'

defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: String,
  error: String,
  hint: String,
  required: Boolean,
  disabled: Boolean,
  id: String,
  rows: { type: Number, default: 4 },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <AppInput
    :model-value="modelValue"
    as="textarea"
    :label="label"
    :placeholder="placeholder"
    :error="error"
    :hint="hint"
    :required="required"
    :disabled="disabled"
    :id="id"
    :rows="rows"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
