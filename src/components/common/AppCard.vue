<script setup>
defineProps({
  padding: { type: String, default: 'p-5' },
})
</script>

<template>
  <div class="bg-card rounded-xl border border-line shadow-sm" :class="padding">
    <slot />
  </div>
</template>
