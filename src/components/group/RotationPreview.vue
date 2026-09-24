<script setup>
import { computed } from 'vue'
import { CheckCircle2 } from '@lucide/vue'
import AppCard from '@/components/common/AppCard.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  members: { type: Array, default: () => [] },
  turnOrder: { type: Array, default: null },
  currentRecipientId: { type: String, default: '' },
})

defineEmits(['show-rotation'])

function memberSlots(m) {
  return Math.max(1, Number(m?.slots) || 1)
}

const turns = computed(() => {
  const sorted = [...props.members].sort((a, b) => (a.rotationOrder || 0) - (b.rotationOrder || 0))
  const byId = Object.fromEntries(sorted.map((m) => [m.id, m]))

  let sequence
  if (Array.isArray(props.turnOrder) && props.turnOrder.length) {
    sequence = props.turnOrder.map((id) => byId[id]).filter(Boolean)
  } else {
    sequence = []
    for (const m of sorted) {
      for (let i = 0; i < memberSlots(m); i++) sequence.push(m)
    }
  }

  const seen = {}
  let currentAssigned = false
  return sequence.map((m, i) => {
    const received = m.receivedCount ?? 0
    seen[m.id] = seen[m.id] ?? 0
    const isReceived = seen[m.id] < received
    seen[m.id]++
    const isCurrent = !isReceived && !currentAssigned && m.id === props.currentRecipientId
    if (isCurrent) currentAssigned = true
    return {
      key: `${m.id}-${i}`,
      memberId: m.id,
      displayName: m.displayName || m.email || 'Member',
      isReceived,
      isCurrent,
    }
  })
})

function firstName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  return parts[0] || 'Member'
}

function ringClass(t) {
  if (t.isReceived) return 'ring-2 ring-success-500'
  if (t.isCurrent) return 'ring-2 ring-primary-400'
  return 'ring-2 ring-line'
}

function labelClass(t) {
  if (t.isCurrent) return 'text-primary-700 font-medium'
  return 'text-muted'
}
</script>

<template>
  <AppCard padding="p-0" class="overflow-hidden">
    <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
      <div>
        <h3 class="text-sm font-semibold text-fg">Rotation preview</h3>
        <p class="text-xs text-muted mt-0.5">Upcoming payout order for this rotation.</p>
      </div>
      <AppButton
        variant="secondary"
        size="xs"
        class="shrink-0"
        @click="$emit('show-rotation')"
      >
        View full rotation
      </AppButton>
    </div>
    <div v-if="turns.length" class="flex gap-4 overflow-x-auto px-5 py-4">
      <div
        v-for="t in turns"
        :key="t.key"
        class="flex w-16 shrink-0 flex-col items-center gap-1.5"
      >
        <div class="relative">
          <AppAvatar
            :name="t.displayName"
            :id="t.memberId"
            size="md"
            class="ring-offset-2 ring-offset-card"
            :class="ringClass(t)"
          />
          <CheckCircle2
            v-if="t.isReceived"
            class="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-success-600"
          />
        </div>
        <span class="w-full truncate text-center text-xs" :class="labelClass(t)">
          {{ firstName(t.displayName) }}
        </span>
      </div>
    </div>
    <p v-else class="px-5 py-8 text-center text-sm text-muted">No payout turns yet.</p>
  </AppCard>
</template>
