<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: String,
  type: { type: String, default: 'text' },
  as: { type: String, default: 'input' },
  placeholder: String,
  error: String,
  hint: String,
  required: Boolean,
  disabled: Boolean,
  id: String,
})

defineEmits(['update:modelValue'])

const attrs = useAttrs()
const wrapperClass = computed(() => attrs.class)
const controlAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest.class
  return rest
})
</script>

<template>
  <div :class="wrapperClass">
    <label v-if="label" :for="id" class="block text-sm font-medium text-fg-2 mb-1">
      {{ label }}
      <span v-if="required" class="text-danger-500 ml-0.5">*</span>
    </label>
    <div class="relative">
      <component
        :is="as"
        v-bind="controlAttrs"
        :id="id"
        :type="as === 'input' ? type : undefined"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="block w-full rounded-lg border bg-card px-3 py-2 text-sm text-fg transition-colors placeholder:text-fg-4 focus:outline-none focus:ring-2 disabled:bg-line-subtle disabled:text-fg-4"
        :class="[
          error
            ? 'border-danger-400 focus:ring-danger-500'
            : 'border-line focus:ring-primary-500 focus:border-primary-500',
          $slots.trailing && 'pr-10',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      >
        <slot />
      </component>
      <div v-if="$slots.trailing" class="absolute right-1 top-1/2 -translate-y-1/2">
        <slot name="trailing" />
      </div>
    </div>
    <p v-if="error" class="mt-1 text-sm text-danger-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-muted">{{ hint }}</p>
  </div>
</template>
