<script setup>
import { computed } from 'vue'
import { AlertTriangle, Info, CheckCircle2 } from '@lucide/vue'

const props = defineProps({
  variant: { type: String, default: 'info' },
  title: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
})

defineEmits(['action'])

const variants = {
  danger: {
    cls: 'bg-danger-50 border-danger-200 text-danger-800',
    icon: AlertTriangle,
    iconCls: 'text-danger-600',
    btn: 'text-danger-800 hover:text-danger-900',
  },
  warning: {
    cls: 'bg-warning-50 border-warning-200 text-warning-800',
    icon: AlertTriangle,
    iconCls: 'text-warning-600',
    btn: 'text-warning-800 hover:text-warning-900',
  },
  info: {
    cls: 'bg-info-50 border-info-200 text-info-800',
    icon: Info,
    iconCls: 'text-info-600',
    btn: 'text-info-800 hover:text-info-900',
  },
  success: {
    cls: 'bg-success-50 border-success-200 text-success-800',
    icon: CheckCircle2,
    iconCls: 'text-success-600',
    btn: 'text-success-800 hover:text-success-900',
  },
}

const config = computed(() => variants[props.variant] || variants.info)
</script>

<template>
  <div class="rounded-xl border p-4 flex items-start gap-3" :class="config.cls">
    <component :is="config.icon" class="w-5 h-5 shrink-0 mt-0.5" :class="config.iconCls" />
    <div class="flex-1 min-w-0">
      <p v-if="title" class="text-sm font-medium">{{ title }}</p>
      <div v-if="$slots.default" class="text-sm" :class="title ? 'mt-0.5 opacity-90' : ''">
        <slot />
      </div>
    </div>
    <button
      v-if="actionLabel"
      class="text-sm font-medium underline shrink-0 py-1.5 -my-1.5 cursor-pointer"
      :class="config.btn"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
