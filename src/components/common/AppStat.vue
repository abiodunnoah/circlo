<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  variant: { type: String, default: 'primary' },
  interactive: { type: Boolean, default: false },
})

const chipClass = computed(
  () =>
    ({
      primary: 'bg-primary-100 text-primary-700',
      accent: 'bg-accent-100 text-accent-700',
      success: 'bg-success-100 text-success-700',
      warning: 'bg-warning-100 text-warning-700',
      danger: 'bg-danger-100 text-danger-700',
      info: 'bg-info-100 text-info-700',
    })[props.variant] || 'bg-primary-100 text-primary-700',
)

defineEmits(['click'])
</script>

<template>
  <div
    class="bg-card rounded-xl border border-line shadow-sm p-5 transition-shadow"
    :class="interactive ? 'cursor-pointer hover:shadow-md text-left w-full' : ''"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive ? 0 : undefined"
    @click="interactive && $emit('click')"
    @keydown.enter="interactive && $emit('click')"
    @keydown.space.prevent="interactive && $emit('click')"
  >
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm text-muted">{{ label }}</p>
      <span
        v-if="icon"
        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        :class="chipClass"
      >
        <component :is="icon" class="w-4 h-4" />
      </span>
    </div>
    <p class="text-xl sm:text-2xl font-bold text-fg tabular-nums mt-1 break-words">{{ value }}</p>
    <p v-if="hint" class="text-xs text-muted mt-1">{{ hint }}</p>
  </div>
</template>
