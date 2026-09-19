<script setup>
import { computed } from 'vue'
import {
  CheckCircle2,
  ArrowRightCircle,
  AlertTriangle,
  Clock,
  CircleDot,
  XCircle,
  Ban,
} from '@lucide/vue'

const props = defineProps({
  status: { type: String, default: 'default' },
  label: { type: String, default: '' },
})

const map = {
  paid: { cls: 'bg-success-100 text-success-700', icon: CheckCircle2, label: 'Paid' },
  received: { cls: 'bg-success-100 text-success-700', icon: CheckCircle2, label: 'Received' },
  next: { cls: 'bg-info-100 text-info-700', icon: ArrowRightCircle, label: 'Next' },
  owing: { cls: 'bg-danger-100 text-danger-700', icon: AlertTriangle, label: 'Owing' },
  pending: { cls: 'bg-warning-100 text-warning-800', icon: Clock, label: 'Pending' },
  active: { cls: 'bg-primary-100 text-primary-700', icon: CircleDot, label: 'Active' },
  left: { cls: 'bg-line text-fg-3', icon: XCircle, label: 'Left' },
  rejected: { cls: 'bg-danger-100 text-danger-700', icon: XCircle, label: 'Rejected' },
  void: { cls: 'bg-line text-fg-3', icon: Ban, label: 'Void' },
  default: { cls: 'bg-line text-fg-2', icon: null, label: '' },
}

const config = computed(() => map[props.status] || map.default)
const text = computed(() => props.label || config.value.label)
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
    :class="config.cls"
  >
    <component :is="config.icon" v-if="config.icon" class="w-3.5 h-3.5 shrink-0" />
    <slot>{{ text }}</slot>
  </span>
</template>
