<script setup>
defineProps({
  modelValue: String,
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  error: String,
  required: Boolean,
  disabled: Boolean,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-slate-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="block w-full rounded-lg border px-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500"
      :class="
        error
          ? 'border-red-400 focus:ring-red-500'
          : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
      "
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
