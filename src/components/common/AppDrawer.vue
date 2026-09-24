<script setup>
import { X } from '@lucide/vue'

defineProps({
  open: Boolean,
  title: { type: String, default: '' },
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
        @keydown.esc="$emit('close')"
      >
        <div class="fixed inset-0 bg-overlay" @click="$emit('close')" />
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
          class="relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
        >
          <div class="sm:hidden pt-2 flex justify-center" aria-hidden="true">
            <span class="h-1.5 w-10 rounded-full bg-line-strong" />
          </div>
          <div v-if="title || $slots.header" class="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 class="text-base font-semibold text-fg">{{ title }}</h2>
            <slot name="header" />
            <button
              class="-mr-1.5 p-2 rounded-lg text-fg-4 hover:text-fg-3 cursor-pointer"
              aria-label="Close"
              @click="$emit('close')"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-2">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
