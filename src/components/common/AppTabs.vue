<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  tabs: { type: Array, default: () => [] },
})

defineEmits(['update:modelValue'])

const normalized = computed(() =>
  props.tabs.map((t) => (typeof t === 'string' ? { label: t, value: t } : t)),
)
</script>

<template>
  <div
    role="tablist"
    class="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-line p-1"
  >
    <button
      v-for="t in normalized"
      :key="t.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === t.value"
      class="whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      :class="modelValue === t.value ? 'bg-card text-fg shadow-sm' : 'text-fg-3 hover:text-fg'"
      @click="$emit('update:modelValue', t.value)"
    >
      {{ t.label }}
      <span
        v-if="t.badge"
        class="ml-1.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-xs font-semibold text-inverse leading-none"
      >
        {{ t.badge }}
      </span>
    </button>
  </div>
</template>
