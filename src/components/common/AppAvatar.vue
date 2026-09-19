<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  id: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const palette = [
  'bg-primary-100 text-primary-700',
  'bg-accent-100 text-accent-700',
  'bg-info-100 text-info-700',
  'bg-danger-100 text-danger-700',
  'bg-success-100 text-success-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
]

const initials = computed(() => {
  const n = (props.name || '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const colorClass = computed(() => {
  const key = props.id || props.name || ''
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
})

const sizeClass = computed(
  () =>
    ({
      sm: 'w-7 h-7 text-[11px]',
      md: 'w-9 h-9 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-14 h-14 text-lg',
    })[props.size] || 'w-9 h-9 text-sm',
)
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none"
    :class="[colorClass, sizeClass]"
    :title="name"
  >
    {{ initials }}
  </span>
</template>
