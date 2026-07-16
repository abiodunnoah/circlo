<script setup>
defineProps({
  padding: { type: String, default: 'p-5' },
})
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm" :class="padding">
    <slot />
  </div>
</template>
