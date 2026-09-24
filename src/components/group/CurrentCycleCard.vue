<script setup>
import AppCard from '@/components/common/AppCard.vue'
import AppProgressRing from '@/components/common/AppProgressRing.vue'
import AppMoney from '@/components/common/AppMoney.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAlert from '@/components/common/AppAlert.vue'

defineProps({
  paid: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currentPot: { type: [Number, String], default: 0 },
  nextRecipientName: { type: String, default: '—' },
  currentCycle: { type: Number, default: 0 },
  totalSlots: { type: Number, default: 1 },
  cyclePayoutConfirmed: { type: Boolean, default: false },
  unpaidDuesCount: { type: Number, default: 0 },
  unpaidMemberNames: { type: Array, default: () => [] },
  showConfirmPayout: { type: Boolean, default: false },
  confirmDisabled: { type: Boolean, default: false },
  confirmTitle: { type: String, default: '' },
  showStartCycle: { type: Boolean, default: false },
  startDisabled: { type: Boolean, default: false },
  startTitle: { type: String, default: '' },
})

defineEmits(['confirm-payout', 'start-cycle'])
</script>

<template>
  <AppCard>
    <div class="flex flex-col sm:flex-row sm:items-start gap-6">
      <div class="flex items-center gap-4 shrink-0">
        <AppProgressRing
          :value="paid"
          :max="total || 1"
          variant="primary"
          :label="`Current pot: ${paid} of ${total} paid`"
        >
          <span class="text-xl font-bold text-fg tabular-nums">{{ paid }}</span>
        </AppProgressRing>
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-wide">Current pot</p>
          <AppMoney :value="currentPot" size="xl" class="block mt-0.5" />
          <p class="text-xs text-muted mt-0.5">{{ paid }} of {{ total }} paid</p>
        </div>
      </div>

      <div class="flex-1 min-w-0 sm:border-l sm:border-line sm:pl-6">
        <p class="text-xs font-medium text-muted uppercase tracking-wide">Next recipient</p>
        <p class="text-lg font-semibold text-fg mt-0.5 break-words">{{ nextRecipientName }}</p>
        <p class="text-sm text-muted mt-0.5">Cycle {{ currentCycle }} of {{ totalSlots }}</p>
        <p v-if="cyclePayoutConfirmed" class="text-xs text-success-600 font-medium mt-1.5">
          Payout confirmed for this cycle
        </p>
        <p v-else-if="currentCycle > 0" class="text-xs text-muted mt-1.5">
          Payout not confirmed yet
        </p>
      </div>
    </div>

    <AppAlert
      v-if="unpaidDuesCount > 0"
      variant="warning"
      class="mt-5"
      :title="`${unpaidDuesCount} contributor${unpaidDuesCount === 1 ? '' : 's'} haven't paid for this cycle yet.`"
    >
      <p class="text-xs">{{ unpaidMemberNames.join(', ') }}</p>
    </AppAlert>

    <div v-if="showConfirmPayout || showStartCycle" class="flex flex-wrap gap-2 mt-5">
      <AppButton
        v-if="showConfirmPayout"
        variant="primary"
        :disabled="confirmDisabled"
        :title="confirmTitle"
        @click="$emit('confirm-payout')"
      >
        Confirm Payout
      </AppButton>
      <AppButton
        v-if="showStartCycle"
        variant="primary"
        :disabled="startDisabled"
        :title="startTitle"
        @click="$emit('start-cycle')"
      >
        Start new cycle
      </AppButton>
    </div>
  </AppCard>
</template>
