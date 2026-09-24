<script setup>
import AppInput from './AppInput.vue'

defineProps({
  modelValue: [String, Number],
  label: String,
  error: String,
  hint: String,
  required: Boolean,
  disabled: Boolean,
  id: String,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <AppInput
    :model-value="modelValue"
    type="date"
    :label="label"
    :error="error"
    :hint="hint"
    :required="required"
    :disabled="disabled"
    :id="id"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
