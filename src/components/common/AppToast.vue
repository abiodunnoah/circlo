<script setup>
import { useToast } from '@/composables/useToast'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from '@lucide/vue'

const { toasts, dismiss } = useToast()

const icons = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle }
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all animate-slide-in"
      :class="{
        'bg-card text-fg border border-line': toast.type === 'info',
        'bg-success-600 text-white': toast.type === 'success',
        'bg-danger-600 text-white': toast.type === 'error',
        'bg-accent-500 text-white': toast.type === 'warning',
      }"
    >
      <component :is="icons[toast.type] || Info" class="w-4 h-4 shrink-0 mt-0.5" />
      <span class="flex-1">{{ toast.message }}</span>
      <button
        class="shrink-0 -my-2 -mr-2 p-2 opacity-70 hover:opacity-100 cursor-pointer"
        aria-label="Dismiss notification"
        @click="dismiss(toast.id)"
      >
        <X class="w-4 h-4" />
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
