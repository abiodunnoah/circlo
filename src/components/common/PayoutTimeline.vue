<script setup>
import { computed } from 'vue'
import { CheckCircle2 } from '@lucide/vue'
import AppAvatar from './AppAvatar.vue'
import AppStatusBadge from './AppStatusBadge.vue'

const props = defineProps({
  members: { type: Array, default: () => [] },
  turnOrder: { type: Array, default: null },
  currentRecipientId: { type: String, default: '' },
})

const turns = computed(() => {
  const sorted = [...props.members].sort((a, b) => (a.rotationOrder || 0) - (b.rotationOrder || 0))
  const byId = Object.fromEntries(sorted.map((m) => [m.id, m]))

  let sequence
  if (Array.isArray(props.turnOrder) && props.turnOrder.length) {
    sequence = props.turnOrder.map((id) => byId[id]).filter(Boolean)
  } else {
    sequence = []
    for (const m of sorted) {
      const slots = m.slots ?? 1
      for (let i = 0; i < slots; i++) sequence.push(m)
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
      position: i + 1,
    }
  })
})

function nodeClass(t) {
  if (t.isReceived) return 'bg-success-100 text-success-700 border-success-200'
  if (t.isCurrent) return 'bg-info-100 text-info-700 border-info-300 ring-2 ring-info-100'
  return 'bg-card text-fg-4 border-line'
}
</script>

<template>
  <ol v-if="turns.length" class="relative">
    <li
      v-for="(t, i) in turns"
      :key="t.key"
      class="relative flex items-start gap-3 pb-3 last:pb-0"
    >
      <span
        v-if="i < turns.length - 1"
        class="absolute left-4 top-8 bottom-0 w-px -translate-x-1/2"
        :class="t.isReceived ? 'bg-success-200' : 'bg-line'"
        aria-hidden="true"
      />
      <span
        class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border"
        :class="nodeClass(t)"
      >
        <CheckCircle2 v-if="t.isReceived" class="w-4 h-4" />
        <span v-else class="tabular-nums">{{ t.position }}</span>
      </span>
      <div class="flex-1 min-w-0 flex items-center justify-between gap-3 pt-1">
        <div class="flex items-center gap-2 min-w-0">
          <AppAvatar :name="t.displayName" :id="t.memberId" size="sm" />
          <p class="text-sm font-medium text-fg truncate">{{ t.displayName }}</p>
        </div>
        <AppStatusBadge v-if="t.isReceived" status="received" />
        <AppStatusBadge v-else-if="t.isCurrent" status="next" label="Up next" />
        <span v-else class="text-xs text-muted shrink-0">Waiting</span>
      </div>
    </li>
  </ol>
  <p v-else class="text-sm text-muted py-4 text-center">No payout turns yet.</p>
</template>
