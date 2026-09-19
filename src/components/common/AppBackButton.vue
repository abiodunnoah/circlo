<script setup>
import { useRouter } from 'vue-router'
import { ChevronLeft } from '@lucide/vue'

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
  <button class="inline-flex items-center gap-1.5 text-sm text-fg-3 hover:text-primary-700 mb-4 cursor-pointer transition-colors" @click="goBack">
    <ChevronLeft class="w-4 h-4" />
    {{ label }}
  </button>
</template>
