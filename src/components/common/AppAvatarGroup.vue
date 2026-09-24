<script setup>
import { computed } from 'vue'
import AppAvatar from './AppAvatar.vue'

const props = defineProps({
  members: { type: Array, default: () => [] },
  max: { type: Number, default: 4 },
  size: { type: String, default: 'sm' },
})

const shown = computed(() => props.members.slice(0, props.max))
const extra = computed(() => Math.max(0, props.members.length - props.max))

const extraSize = computed(
  () =>
    ({
      sm: 'w-7 h-7 text-[11px]',
      md: 'w-9 h-9 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-14 h-14 text-lg',
    })[props.size] || 'w-7 h-7 text-[11px]',
)
</script>

<template>
  <div class="flex items-center -space-x-2">
    <AppAvatar
      v-for="m in shown"
      :key="m.id || m.name || m.displayName"
      :name="m.name || m.displayName"
      :id="m.id"
      :size="size"
      class="ring-2 ring-card"
    />
    <span
      v-if="extra"
      class="inline-flex items-center justify-center rounded-full bg-line font-semibold text-fg-2 ring-2 ring-card"
      :class="extraSize"
      :title="`${extra} more`"
    >
      +{{ extra }}
    </span>
  </div>
</template>
