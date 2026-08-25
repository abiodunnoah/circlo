<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: Boolean,
  title: String,
  size: { type: String, default: 'md' },
})

defineEmits(['close'])

const dialogRef = ref(null)
let previouslyFocused = null

watch(
  () => props.open,
  (open) => {
    if (open) {
      previouslyFocused = document.activeElement
      requestAnimationFrame(() => dialogRef.value?.focus())
    } else if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus()
      previouslyFocused = null
    }
  },
)

onBeforeUnmount(() => {
  if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
    previouslyFocused.focus()
    previouslyFocused = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center p-4" @keydown.esc="$emit('close')">
      <div class="fixed inset-0 bg-black/40 transition-opacity" @click="$emit('close')" />
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        class="relative bg-white rounded-xl shadow-xl w-full animate-modal-in overflow-y-auto max-h-[90vh] outline-none"
        :class="{
          'max-w-sm': size === 'sm',
          'max-w-lg': size === 'md',
          'max-w-2xl': size === 'lg',
        }"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
          <button class="text-slate-400 hover:text-slate-600 cursor-pointer" @click="$emit('close')">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes modal-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-modal-in { animation: modal-in 0.15s ease-out; }
</style>
