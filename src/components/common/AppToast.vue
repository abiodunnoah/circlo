<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all animate-slide-in"
      :class="{
        'bg-white text-slate-800 border border-slate-200': toast.type === 'info',
        'bg-green-600 text-white': toast.type === 'success',
        'bg-red-600 text-white': toast.type === 'error',
        'bg-accent-500 text-white': toast.type === 'warning',
      }"
    >
      <span class="flex-1">{{ toast.message }}</span>
      <button class="shrink-0 opacity-70 hover:opacity-100 cursor-pointer" @click="dismiss(toast.id)">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.2s ease-out; }
</style>
