<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  fallback: { type: [String, Object], required: true },
  label: { type: String, default: 'Back' },
})

const router = useRouter()

function goBack() {
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push(props.fallback)
  }
}
</script>

<template>
  <button class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary-700 mb-4 cursor-pointer transition-colors" @click="goBack">
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    {{ label }}
  </button>
</template>
