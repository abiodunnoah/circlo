<script setup>
defineProps({
  padding: { type: String, default: 'p-5' },
  hover: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="bg-card rounded-xl border border-line shadow-sm"
    :class="[padding, hover && 'transition-shadow hover:shadow-md']"
  >
    <slot />
  </div>
</template>
