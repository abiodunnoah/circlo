<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
})
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
    <div class="min-w-0">
      <h1 class="text-2xl font-bold text-fg flex items-center gap-2.5 break-words">
        <component v-if="icon" :is="icon" class="w-6 h-6 text-primary-600 shrink-0" />
        <span>{{ title }}</span>
      </h1>
      <p v-if="subtitle" class="text-sm text-muted mt-1 break-words">{{ subtitle }}</p>
      <slot name="subtitle" />
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
