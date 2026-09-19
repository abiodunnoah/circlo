<script setup>
defineProps({
  circle: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="animate-pulse bg-line"
    :class="circle ? 'rounded-full' : 'rounded-md'"
  />
</template>
