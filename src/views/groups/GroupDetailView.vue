<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useContributionsStore } from '@/stores/contributions'
import { createNotification } from '@/stores/notifications'
import { useToast } from '@/composables/useToast'
import { CalendarClock, ChevronUp, ChevronDown, AlertTriangle } from '@lucide/vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppBackButton from '@/components/common/AppBackButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppCard from '@/components/common/AppCard.vue'
import TableWrap from '@/components/common/TableWrap.vue'
import PayoutTimeline from '@/components/common/PayoutTimeline.vue'
import { formatNaira } from '@/utils/format'

function formatCycleDate(timestamp) {
  if (!timestamp) return ''
  const ms = typeof timestamp.toMillis === 'function' ? timestamp.toMillis() : timestamp
  if (typeof ms === 'number' && Number.isFinite(ms)) {
    return new Date(ms).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return ''
}

function memberSlots(m) {
  return Math.max(1, Number(m?.slots) || 1)
}

function nextPosition(m) {
  const turnOrder = groupsStore.currentGroup?.turnOrder
  const received = m?.receivedCount || 0
  if (Array.isArray(turnOrder) && turnOrder.length > 0 && m?.id) {
    let seen = 0
    for (let i = 0; i < turnOrder.length; i++) {
      if (turnOrder[i] === m.id) {
        if (seen === received) return i
        seen++
      }
    }
    return Number.MAX_SAFE_INTEGER
  }
  return (m?.rotationOrder || 0) + received
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const contributionsStore = useContributionsStore()
const toast = useToast()

const groupId = route.params.id
const tab = ref(route.query.tab === 'pending' ? 'pending' : route.query.tab === 'contributions' ? 'contributions' : 'members')
const inviteLink = ref('')
const showInviteModal = ref(false)
const showRemoveModal = ref(false)
const memberToRemove = ref(null)
const showCycleModal = ref(false)
const showMarkPaidModal = ref(false)
const memberToMarkPaid = ref(null)
const showPayoutModal = ref(false)
const memberToPayout = ref(null)
const forcePayout = ref(false)
const showArchiveModal = ref(false)
const showDeleteGroupModal = ref(false)
const scheduleOrder = ref([])

const selectedCycle = ref(0)
const cycleOptions = ref([])
const pendingSlots = ref({})
const editingSlotsMember = ref(null)
const editSlotsValue = ref(1)
const showSlotsModal = ref(false)
let unsubscribe = null
let unsubscribeContributions = null

onMounted(() => {
  unsubscribe = groupsStore.subscribeToGroup(groupId)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (unsubscribeContributions) unsubscribeContributions()
})

const isAdmin = computed(() => groupsStore.currentGroup?.adminId === authStore.user?.uid)

const currentCycle = computed(() => groupsStore.currentGroup?.currentCycle || 0)

const cycleStarted = computed(() => currentCycle.value > 0)

const eligibleMembers = computed(() =>
  groupsStore.approvedMembers.filter((m) => (m.joinedCycle ?? 1) <= Math.max(currentCycle.value, 1)),
)

const rotationConcluded = computed(() =>
  eligibleMembers.value.length > 0 && eligibleMembers.value.every((m) => m.hasReceived),
)

const cyclePayoutConfirmed = computed(() => !!groupsStore.currentGroup?.currentCyclePayoutConfirmed)

const cycleConcluded = computed(() => {
  if (currentCycle.value === 0) return true
  if (!groupsStore.currentGroup?.currentCycleRecipientId) return true
  return cyclePayoutConfirmed.value
})

const canStartCycle = computed(() => isAdmin.value && cycleConcluded.value)

const canRemoveMembers = computed(() => isAdmin.value && (currentCycle.value === 0 || rotationConcluded.value))

const canReorder = computed(() => isAdmin.value && (currentCycle.value === 0 || rotationConcluded.value))

const detailTabs = computed(() => {
  const tabs = [{ label: 'Members', value: 'members' }]
  if (isAdmin.value) {
    tabs.push({ label: 'Pending', value: 'pending', badge: groupsStore.pendingMembers.length || undefined })
  }
  tabs.push({ label: 'Contributions', value: 'contributions' })
  if (isAdmin.value && canReorder.value) tabs.push({ label: 'Schedule', value: 'schedule' })
  return tabs
})

const nextMember = computed(() => {
  const unreceived = eligibleMembers.value
    .filter((m) => (m.receivedCount || 0) < memberSlots(m))
    .sort((a, b) => nextPosition(a) - nextPosition(b))
  return unreceived[0]
})

const cycleContributions = computed(() => {
  if (!contributionsStore.contributionsByMember) return {}
  return contributionsStore.contributionsByMember
})

const contributionRows = computed(() => {
  const rows = eligibleMembers.value.map((m) => {
    const contribution = cycleContributions.value[m.id] || null
    const isVoid = contribution?.status === 'void'
    const isPaid = contribution?.status === 'paid'
    return {
      member: m,
      contribution,
      isVoid,
      isPaid,
      isOwing: (m.receivedCount || 0) > 0 && !isPaid && !isVoid,
    }
  })
  return rows.sort((a, b) => {
    if (a.isOwing && !b.isOwing) return -1
    if (!a.isOwing && b.isOwing) return 1
    return 0
  })
})

const contributionStats = computed(() => {
  const paid = contributionRows.value.filter((r) => r.isPaid && !r.isVoid).length
  const total = contributionRows.value.length
  return { paid, total }
})

const unpaidDuesCount = computed(() => {
  if (currentCycle.value === 0) return 0
  if (selectedCycle.value !== currentCycle.value) return 0
  return contributionRows.value.filter((r) => !r.isPaid && !r.isVoid).length
})

const unpaidMemberNames = computed(() => {
  if (currentCycle.value === 0) return []
  if (selectedCycle.value !== currentCycle.value) return []
  return contributionRows.value.filter((r) => !r.isPaid && !r.isVoid).map((r) => r.member.displayName)
})

const canConfirmPayout = computed(() => {
  if (!isAdmin.value) return false
  if (currentCycle.value === 0) return false
  const recipientId = groupsStore.currentGroup?.currentCycleRecipientId
  if (!recipientId) return false
  if (cyclePayoutConfirmed.value) return false
  if (selectedCycle.value !== currentCycle.value) return false
  return unpaidDuesCount.value === 0
})

watch(
  () => groupsStore.currentGroup?.currentCycle,
  (cycle) => {
    const c = cycle || 0
    selectedCycle.value = c
    cycleOptions.value = Array.from({ length: c }, (_, i) => i + 1)
    if (tab.value === 'contributions' && c >= 1) {
      if (unsubscribeContributions) unsubscribeContributions()
      unsubscribeContributions = contributionsStore.subscribeToCycleContributions(groupId, c)
    }
  },
  { immediate: true },
)

watch(
  () => tab.value,
  (value) => {
    if (value === 'contributions' && currentCycle.value >= 1 && !unsubscribeContributions) {
      unsubscribeContributions = contributionsStore.subscribeToCycleContributions(groupId, selectedCycle.value)
    }
    if (value !== 'contributions' && unsubscribeContributions) {
      unsubscribeContributions()
      unsubscribeContributions = null
    }
  },
)

watch(selectedCycle, (cycle) => {
  if (cycle >= 1 && tab.value === 'contributions') {
    if (unsubscribeContributions) unsubscribeContributions()
    unsubscribeContributions = contributionsStore.subscribeToCycleContributions(groupId, cycle)
  }
})

watch(
  () => tab.value,
  (value) => {
    if (value === 'schedule') initSchedule()
  },
)

async function copyInviteLink() {
  if (!inviteLink.value) {
    inviteLink.value = await groupsStore.generateInviteLink(groupId)
  }
  showInviteModal.value = true
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    toast.show('Invite link copied', 'success')
  } catch {
    toast.show('Failed to copy', 'error')
  }
}

function shareToWhatsApp() {
  const message = `Join my Circlo savings group: ${inviteLink.value}`
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
}

async function handleApprove(member) {
  try {
    const slots = Number(pendingSlots.value[member.id]) || 1
    await groupsStore.approveMember(groupId, member.id, slots)
    toast.show(`${member.displayName} approved`, 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleReject(member) {
  try {
    await groupsStore.rejectMember(groupId, member.id)
    toast.show(`${member.displayName} rejected`, 'info')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function openRemoveModal(member) {
  memberToRemove.value = member
  showRemoveModal.value = true
}

async function handleRemove() {
  if (!memberToRemove.value) return
  try {
    await groupsStore.removeMember(groupId, memberToRemove.value.id)
    toast.show(`${memberToRemove.value.displayName} removed`, 'info')
    showRemoveModal.value = false
    memberToRemove.value = null
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function openSlotsModal(member) {
  editingSlotsMember.value = member
  editSlotsValue.value = memberSlots(member)
  showSlotsModal.value = true
}

async function confirmEditSlots() {
  if (!editingSlotsMember.value) return
  try {
    await groupsStore.setMemberSlots(groupId, editingSlotsMember.value.id, editSlotsValue.value)
    toast.show(`${editingSlotsMember.value.displayName}'s slots updated`, 'success')
    showSlotsModal.value = false
    editingSlotsMember.value = null
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function initSchedule() {
  const turnOrder = groupsStore.currentGroup?.turnOrder
  const members = groupsStore.approvedMembers
  if (Array.isArray(turnOrder) && turnOrder.length > 0) {
    scheduleOrder.value = [...turnOrder]
  } else {
    const order = []
    for (const m of members) {
      const slots = memberSlots(m)
      for (let i = 0; i < slots; i++) order.push(m.id)
    }
    scheduleOrder.value = order
  }
}

function moveTurn(index, direction) {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= scheduleOrder.value.length) return
  const arr = [...scheduleOrder.value]
  const temp = arr[index]
  arr[index] = arr[target]
  arr[target] = temp
  scheduleOrder.value = arr
}

async function saveSchedule() {
  try {
    await groupsStore.saveTurnOrder(groupId, scheduleOrder.value)
    toast.show('Payout schedule saved', 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function resetSchedule() {
  try {
    await groupsStore.resetTurnOrder(groupId)
    toast.show('Schedule reset to default', 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function spreadEvenly(memberId) {
  const total = scheduleOrder.value.length
  const memberTurns = scheduleOrder.value.filter((id) => id === memberId)
  const count = memberTurns.length
  if (count === 0 || count >= total) return
  const gap = total / count
  const others = scheduleOrder.value.map((id, i) => ({ id, origIndex: i })).filter((e) => e.id !== memberId)
  const arr = Array.from({ length: total }, () => null)
  for (let i = 0; i < count; i++) {
    const pos = Math.round(i * gap)
    arr[pos] = memberId
  }
  let oi = 0
  for (let i = 0; i < total; i++) {
    if (arr[i] === null) {
      arr[i] = others[oi++].id
    }
  }
  scheduleOrder.value = arr
}

async function handleStartCycle() {
  try {
    const newCycle = (groupsStore.currentGroup?.currentCycle || 0) + 1
    await groupsStore.startNewCycle(groupId)
    toast.show(`Cycle ${newCycle} started`, 'success')
    showCycleModal.value = false
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function openMarkPaidModal(member) {
  memberToMarkPaid.value = member
  showMarkPaidModal.value = true
}

async function confirmMarkPaid() {
  if (!memberToMarkPaid.value) return
  try {
    await contributionsStore.markAsPaid(groupId, memberToMarkPaid.value.userId, selectedCycle.value)
    toast.show(`${memberToMarkPaid.value.displayName} marked as paid`, 'success')
    showMarkPaidModal.value = false
    memberToMarkPaid.value = null
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function openPayoutModal(member, isForce = false) {
  memberToPayout.value = member
  forcePayout.value = isForce
  showPayoutModal.value = true
}

async function confirmPayout() {
  if (!memberToPayout.value) return
  try {
    await contributionsStore.confirmPayout(groupId, memberToPayout.value.id, selectedCycle.value, forcePayout.value)
    toast.show(`Payout confirmed for ${memberToPayout.value.displayName}`, 'success')
    showPayoutModal.value = false
    memberToPayout.value = null
    forcePayout.value = false
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleUndoPayout(member) {
  if (!member) return
  try {
    await contributionsStore.undoPayout(groupId, member.id, selectedCycle.value)
    toast.show(`Payout reverted for ${member.displayName}`, 'info')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleArchive() {
  try {
    await groupsStore.archiveGroup(groupId)
    toast.show('Group archived', 'success')
    showArchiveModal.value = false
    router.push({ name: 'GroupList' })
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleDeleteGroup() {
  try {
    await groupsStore.deleteGroup(groupId)
    toast.show('Group deleted', 'success')
    showDeleteGroupModal.value = false
    router.push({ name: 'GroupList' })
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleRemindAll() {
  try {
    const count = await contributionsStore.remindUnpaid(groupId, selectedCycle.value)
    toast.show(`${count} reminder${count === 1 ? '' : 's'} sent`, 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleRemindSingle(member) {
  if (!member) return
  try {
    await createNotification({
      userId: member.userId || member.id,
      groupId,
      type: 'reminder',
      message: `Reminder: you haven't paid your contribution for Cycle ${selectedCycle.value} in ${groupsStore.currentGroup?.name || 'your group'}.`,
    })
    toast.show(`Reminder sent to ${member.displayName}`, 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleVoid(member) {
  if (!member) return
  try {
    await contributionsStore.voidContribution(groupId, member.userId, selectedCycle.value)
    toast.show(`${member.displayName}'s payment voided`, 'info')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div v-if="groupsStore.currentGroupStatus === 'loading'" aria-label="Loading..." aria-busy="true">
      <AppSkeleton class="h-5 w-16 mb-4" />
      <AppCard class="mb-6">
        <AppSkeleton class="h-7 w-48 mb-2" />
        <AppSkeleton class="h-4 w-64 mb-1" />
        <AppSkeleton class="h-3 w-40" />
      </AppCard>
      <AppCard padding="p-0" class="overflow-hidden">
        <div class="divide-y divide-line-subtle">
          <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-5 py-3.5">
            <AppSkeleton class="h-4 w-6" />
            <AppSkeleton circle class="h-9 w-9 shrink-0" />
            <div class="flex-1 min-w-0">
              <AppSkeleton class="h-3.5 w-28 mb-1.5" />
              <AppSkeleton class="h-3 w-36" />
            </div>
            <AppSkeleton class="h-5 w-14 rounded-full" />
          </div>
        </div>
      </AppCard>
    </div>

    <div v-else-if="groupsStore.currentGroupStatus === 'ready' && groupsStore.currentGroup">
      <AppBackButton :fallback="{ name: 'GroupList' }" />
      <AppCard class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-fg break-words">{{ groupsStore.currentGroup.name }}</h1>
            <p class="text-sm text-muted mt-1">
              {{ formatNaira(groupsStore.currentGroup.contributionAmount) }}/{{ groupsStore.currentGroup.frequency }}
              &middot; Cycle {{ groupsStore.currentGroup.currentCycle }}
              &middot; {{ groupsStore.currentGroup.totalMembers }} members
              &middot; {{ groupsStore.currentGroup.totalSlots || groupsStore.currentGroup.totalMembers }} slots
            </p>
            <p v-if="groupsStore.currentGroup.currentCycleStartDate" class="text-xs text-muted mt-0.5">
              Cycle started {{ formatCycleDate(groupsStore.currentGroup.currentCycleStartDate) }}
            </p>
            <p v-if="isAdmin" class="text-xs text-accent-600 font-medium mt-1">You are the admin</p>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            <AppButton v-if="isAdmin" variant="secondary" @click="copyInviteLink">Copy Invite Link</AppButton>
            <AppButton
              v-if="isAdmin"
              variant="primary"
              :disabled="!canStartCycle"
              :title="canStartCycle ? '' : 'Finish the current cycle before starting a new one'"
              @click="showCycleModal = true"
            >
              Start New Cycle
            </AppButton>
            <AppButton v-if="isAdmin && groupsStore.currentGroup.status !== 'completed'" variant="outline-danger" @click="currentCycle === 0 && contributionRows.every(r => !r.isPaid) ? showDeleteGroupModal = true : showArchiveModal = true">
              {{ currentCycle === 0 && contributionRows.every(r => !r.isPaid) ? 'Delete Group' : 'Archive Group' }}
            </AppButton>
          </div>
        </div>
        <div class="mt-4">
          <AppProgress
            :value="groupsStore.currentGroup.currentCycle"
            :max="groupsStore.currentGroup.totalSlots || groupsStore.currentGroup.totalMembers || 1"
            :label="`Rotation progress · Cycle ${groupsStore.currentGroup.currentCycle} of ${groupsStore.currentGroup.totalSlots || groupsStore.currentGroup.totalMembers || 1}`"
          />
        </div>
      </AppCard>

      <AppTabs v-model="tab" :tabs="detailTabs" class="mb-6" />

      <AppCard v-if="tab === 'members'" padding="p-0" class="overflow-hidden">
        <div class="divide-y divide-line-subtle">
          <div v-for="m in groupsStore.approvedMembers" :key="m.id" class="flex items-start gap-3 px-4 sm:px-5 py-3.5">
            <span class="text-sm font-medium text-muted w-5 text-right shrink-0 tabular-nums mt-1.5">{{ (m.turnPositions?.[0] ?? (m.rotationOrder || 1) - 1) + 1 }}</span>
            <AppAvatar :name="m.displayName" :id="m.id" size="md" class="mt-0.5" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-fg truncate">
                {{ m.displayName }}
                <span v-if="m.userId === groupsStore.currentGroup.adminId" class="text-xs text-accent-600 font-medium">(admin)</span>
              </p>
              <p class="text-xs text-muted truncate">{{ m.email }}</p>
              <p class="text-xs text-accent-600 truncate">{{ memberSlots(m) === 1 ? '1 slot' : `${memberSlots(m)} slots` }} &middot; received {{ m.receivedCount || 0 }}/{{ memberSlots(m) }}</p>
            </div>
            <div class="flex flex-col items-end gap-1.5 shrink-0">
              <template v-if="(m.joinedCycle ?? 1) > currentCycle">
                <AppStatusBadge status="default" :label="`Joins cycle ${m.joinedCycle}`" />
              </template>
              <template v-else>
                <AppStatusBadge v-if="m.hasReceived" status="received" />
                <AppStatusBadge v-else-if="nextMember?.id === m.id" status="next" />
                <AppStatusBadge v-else status="default" label="Waiting" />
              </template>
              <div class="flex gap-2">
                <button v-if="isAdmin && canReorder" class="text-xs text-primary-700 hover:text-primary-800 py-1 -my-1 cursor-pointer" @click="openSlotsModal(m)">Slots</button>
                <button v-if="isAdmin && canRemoveMembers && m.userId !== groupsStore.currentGroup.adminId" class="text-xs text-danger-600 hover:text-danger-700 py-1 -my-1 cursor-pointer" @click="openRemoveModal(m)">Remove</button>
              </div>
            </div>
          </div>
          <div v-if="!groupsStore.approvedMembers.length" class="px-5 py-8 text-center text-sm text-muted">No members yet</div>
        </div>
      </AppCard>

      <AppCard v-if="tab === 'pending'" padding="p-0">
        <div class="divide-y divide-line-subtle">
          <div v-for="r in groupsStore.pendingMembers" :key="r.id" class="flex items-center gap-4 px-5 py-3.5">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-fg truncate">{{ r.displayName }}</p>
              <p class="text-xs text-muted truncate">{{ r.email }}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <label class="text-xs text-muted">Slots</label>
              <select v-model="pendingSlots[r.id]" class="rounded-lg border border-line px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <div class="flex gap-2">
              <AppButton variant="primary" size="xs" @click="handleApprove(r)">Approve</AppButton>
              <AppButton variant="outline-danger" size="xs" @click="handleReject(r)">Reject</AppButton>
            </div>
          </div>
          <div v-if="!groupsStore.pendingMembers.length" class="px-5 py-8 text-center text-sm text-muted">No pending requests</div>
        </div>
      </AppCard>

      <AppCard v-if="tab === 'contributions'" padding="p-0" class="overflow-hidden">
        <div class="px-5 py-3 bg-line-subtle border-b border-line">
          <div class="flex items-center justify-between gap-4 mb-3">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-fg-2">Cycle</p>
              <select v-model="selectedCycle" class="rounded-lg border border-line px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option v-for="c in cycleOptions" :key="c" :value="c">Cycle {{ c }}</option>
              </select>
            </div>
            <p class="text-sm text-muted tabular-nums">{{ contributionStats.paid }} of {{ contributionStats.total }} paid</p>
          </div>
          <AppProgress :value="contributionStats.paid" :max="contributionStats.total || 1" variant="success" size="sm" />
        </div>

        <div v-if="unpaidDuesCount > 0" class="bg-warning-50 border-b border-warning-200 px-5 py-3 text-sm text-warning-800">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium">{{ unpaidDuesCount }} contributor{{ unpaidDuesCount === 1 ? '' : 's' }} haven't paid for this cycle yet.</p>
                <p class="text-xs text-warning-700 mt-0.5">{{ unpaidMemberNames.join(', ') }}</p>
              </div>
            </div>
            <AppButton v-if="isAdmin && cycleStarted" variant="warning" size="xs" class="shrink-0" @click="handleRemindAll">Remind All</AppButton>
          </div>
        </div>

        <div v-if="currentCycle === 0" class="px-5 py-10 text-center text-sm text-muted">
          No cycles yet. {{ isAdmin ? 'Start the first cycle to begin collecting contributions.' : 'Waiting for the admin to start the first cycle.' }}
        </div>

        <div v-else-if="contributionsStore.contributionsLoading" class="px-5 py-10">
          <div class="space-y-3">
            <div v-for="i in 4" :key="i" class="flex items-center gap-4">
              <AppSkeleton class="h-3.5 w-24" />
              <AppSkeleton class="h-5 w-14 rounded-full" />
              <AppSkeleton class="h-3.5 w-16" />
              <AppSkeleton class="h-3.5 w-16" />
            </div>
          </div>
        </div>

        <TableWrap v-else-if="contributionRows.length">
            <thead>
              <tr class="border-b border-line-subtle text-left">
                <th class="px-5 py-3 font-medium text-muted">Member</th>
                <th class="px-5 py-3 font-medium text-muted">Status</th>
                <th class="px-5 py-3 font-medium text-muted hidden sm:table-cell">Amount</th>
                <th class="px-5 py-3 font-medium text-muted hidden md:table-cell">Date Paid</th>
                <th v-if="isAdmin" class="px-5 py-3 font-medium text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line-subtle">
              <tr v-for="row in contributionRows" :key="row.member.id" class="hover:bg-line-subtle">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2.5">
                    <AppAvatar :name="row.member.displayName" :id="row.member.id" size="sm" />
                    <span class="font-medium text-fg">{{ row.member.displayName }}</span>
                  </div>
                </td>
                <td class="px-5 py-3">
                  <AppStatusBadge v-if="row.isVoid" status="void" label="Voided" />
                  <AppStatusBadge v-else-if="row.isOwing" status="owing" />
                  <AppStatusBadge v-else-if="row.isPaid" status="paid" />
                  <AppStatusBadge v-else status="pending" label="Unpaid" />
                </td>
                <td class="px-5 py-3 text-muted hidden sm:table-cell tabular-nums">{{ row.contribution ? formatNaira(row.contribution.amount) : formatNaira(groupsStore.currentGroup.contributionAmount * memberSlots(row.member)) }}</td>
                <td class="px-5 py-3 text-muted hidden md:table-cell">{{ row.contribution?.paidAt ? new Date(row.contribution.paidAt.toMillis ? row.contribution.paidAt.toMillis() : row.contribution.paidAt).toLocaleDateString() : '—' }}</td>
                <td v-if="isAdmin" class="px-5 py-3">
                  <div class="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                    <AppButton v-if="!row.isPaid && !row.isVoid" variant="primary" size="xs" @click="openMarkPaidModal(row.member)">Mark Paid</AppButton>
                    <button v-if="!row.isPaid && !row.isVoid && selectedCycle === currentCycle && cycleStarted" class="text-xs text-warning-600 hover:text-warning-700 cursor-pointer" @click="handleRemindSingle(row.member)">Remind</button>
                    <button v-else-if="row.isPaid" class="text-xs text-danger-600 hover:text-danger-700 cursor-pointer" @click="handleVoid(row.member)">Void</button>
                    <AppButton v-if="!cyclePayoutConfirmed && row.member.id === groupsStore.currentGroup?.currentCycleRecipientId && canConfirmPayout" variant="accent" size="xs" @click="openPayoutModal(row.member, false)">Confirm Payout</AppButton>
                    <button v-if="!cyclePayoutConfirmed && row.member.id === groupsStore.currentGroup?.currentCycleRecipientId && !canConfirmPayout && unpaidDuesCount > 0" class="text-xs text-warning-700 hover:text-warning-800 font-medium cursor-pointer" title="Some members haven't paid yet — force confirm anyway" @click="openPayoutModal(row.member, true)">Force Payout</button>
                    <button v-if="cyclePayoutConfirmed && row.member.id === groupsStore.currentGroup?.currentCycleRecipientId" class="text-xs text-accent-700 hover:text-accent-800 cursor-pointer" @click="handleUndoPayout(row.member)">Undo Payout</button>
                  </div>
                </td>
              </tr>
            </tbody>
        </TableWrap>

        <div v-else class="px-5 py-10 text-center text-sm text-muted">
          {{ isAdmin ? 'No eligible members yet. Approve members to start collecting contributions.' : 'You are not part of the active rotation yet.' }}
        </div>
      </AppCard>
    </div>

    <div
      v-if="tab === 'schedule' && groupsStore.currentGroupStatus === 'ready' && groupsStore.currentGroup"
      class="space-y-6"
    >
      <AppCard padding="p-0" class="overflow-hidden">
        <div class="px-5 py-4 border-b border-line">
          <h3 class="text-sm font-semibold text-fg flex items-center gap-2">
            <CalendarClock class="w-4 h-4 text-primary-600" />
            Payout Order
          </h3>
          <p class="text-xs text-muted mt-0.5">Visual order of payout turns for the current rotation.</p>
        </div>
        <div class="px-5 py-4">
          <PayoutTimeline
            :members="groupsStore.approvedMembers"
            :turn-order="groupsStore.currentGroup?.turnOrder"
            :current-recipient-id="groupsStore.currentGroup?.currentCycleRecipientId || ''"
          />
        </div>
      </AppCard>

      <AppCard padding="p-0" class="overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 class="text-sm font-semibold text-fg">Edit Schedule</h3>
            <p class="text-xs text-muted mt-0.5">Move turns up or down to interleave payouts. Each row is one payout turn.</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <AppButton variant="secondary" size="xs" @click="resetSchedule">Reset</AppButton>
            <AppButton variant="primary" size="xs" @click="saveSchedule">Save</AppButton>
          </div>
        </div>
        <div class="divide-y divide-line-subtle">
          <div v-for="(memberId, idx) in scheduleOrder" :key="idx" class="flex items-center gap-3 px-5 py-2.5">
            <span class="text-xs text-muted w-5 text-right tabular-nums">{{ idx + 1 }}.</span>
            <AppAvatar :name="groupsStore.approvedMembers.find((m) => m.id === memberId)?.displayName" :id="memberId" size="sm" />
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-fg">{{ groupsStore.approvedMembers.find((m) => m.id === memberId)?.displayName || memberId }}</span>
              <span class="text-xs text-muted ml-2">slot {{ scheduleOrder.slice(0, idx + 1).filter((id) => id === memberId).length }}/{{ memberSlots(groupsStore.approvedMembers.find((m) => m.id === memberId)) }}</span>
            </div>
            <div class="flex gap-1">
              <button :disabled="idx === 0" class="p-2 rounded-lg text-fg-4 hover:text-primary-700 hover:bg-line disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" aria-label="Move up" @click="moveTurn(idx, 'up')"><ChevronUp class="w-4 h-4" /></button>
              <button :disabled="idx === scheduleOrder.length - 1" class="p-2 rounded-lg text-fg-4 hover:text-primary-700 hover:bg-line disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" aria-label="Move down" @click="moveTurn(idx, 'down')"><ChevronDown class="w-4 h-4" /></button>
            </div>
          </div>
          <div v-if="!scheduleOrder.length" class="px-5 py-8 text-center text-sm text-muted">No approved members yet.</div>
        </div>
        <div class="px-5 py-3 border-t border-line space-y-1">
          <p class="text-xs font-medium text-muted mb-1">Quick spread</p>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="m in groupsStore.approvedMembers.filter((m) => memberSlots(m) > 1)" :key="m.id" class="text-xs text-primary-700 hover:text-primary-800 border border-primary-200 rounded-lg px-2.5 py-1 cursor-pointer" @click="spreadEvenly(m.id)">Spread {{ m.displayName }} evenly</button>
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard v-else-if="groupsStore.currentGroupStatus === 'not_found'" padding="p-10" class="text-center">
      <p class="text-sm text-muted mb-4">This group doesn't exist or you don't have access to it.</p>
      <AppButton variant="primary" @click="router.push({ name: 'GroupList' })">Back to Groups</AppButton>
    </AppCard>

    <AppCard v-else-if="groupsStore.currentGroupStatus === 'error'" padding="p-10" class="text-center">
      <p class="text-sm text-muted mb-1">Something went wrong</p>
      <p class="text-sm text-danger-600 mb-4">{{ groupsStore.error }}</p>
      <AppButton variant="primary" @click="router.push({ name: 'GroupList' })">Back to Groups</AppButton>
    </AppCard>

    <AppModal :open="showInviteModal" title="Invite Members" @close="showInviteModal = false">
      <p class="text-sm text-muted mb-3">Share this link with your members. Anyone with the link can request to join.</p>
      <div class="flex gap-2">
        <input :value="inviteLink" readonly class="flex-1 min-w-0 rounded-lg border border-line px-3 py-2 text-sm bg-line-subtle" />
        <AppButton variant="primary" @click="copyToClipboard">Copy</AppButton>
      </div>
      <AppButton variant="success" block class="mt-3" @click="shareToWhatsApp">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Share on WhatsApp
      </AppButton>
    </AppModal>

    <AppModal :open="showCycleModal" title="Start New Cycle" @close="showCycleModal = false">
      <p class="text-sm text-muted mb-4">
        This advances the group to Cycle {{ (groupsStore.currentGroup?.currentCycle || 0) + 1 }}. The next member in rotation receives the pot for this cycle, and all eligible members contribute. When every eligible member has received once, a new rotation begins and "received" status resets.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showCycleModal = false">Cancel</AppButton>
        <AppButton variant="primary" :disabled="!canStartCycle" @click="handleStartCycle">Start Cycle</AppButton>
      </template>
    </AppModal>

    <AppModal :open="showRemoveModal" title="Remove Member" @close="showRemoveModal = false">
      <p class="text-sm text-muted mb-4">
        Remove <span class="font-medium text-fg">{{ memberToRemove?.displayName }}</span> from this group? Their contribution history will be preserved.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showRemoveModal = false">Cancel</AppButton>
        <AppButton variant="danger" @click="handleRemove">Remove</AppButton>
      </template>
    </AppModal>

    <AppModal :open="showMarkPaidModal" title="Mark as Paid" size="sm" @close="showMarkPaidModal = false">
      <p class="text-sm text-muted mb-4">
        Confirm that <span class="font-medium text-fg">{{ memberToMarkPaid?.displayName }}</span> paid
        <span class="font-medium text-fg">{{ formatNaira(groupsStore.currentGroup?.contributionAmount * memberSlots(memberToMarkPaid)) }}</span> for Cycle {{ selectedCycle }}.
      </p>
      <p v-if="memberSlots(memberToMarkPaid) > 1" class="text-xs text-accent-600 mb-4">
        This member holds {{ memberSlots(memberToMarkPaid) }} slots and pays {{ memberSlots(memberToMarkPaid) }}× per cycle.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showMarkPaidModal = false">Cancel</AppButton>
        <AppButton variant="primary" @click="confirmMarkPaid">Mark Paid</AppButton>
      </template>
    </AppModal>

    <AppModal :open="showSlotsModal" title="Edit Slots" size="sm" @close="showSlotsModal = false">
      <p class="text-sm text-muted mb-4">
        Set the number of slots for <span class="font-medium text-fg">{{ editingSlotsMember?.displayName }}</span>. A member with N slots pays N× each cycle and receives the pot N times per rotation.
      </p>
      <div class="flex items-center gap-2 mb-4">
        <label class="text-sm text-muted">Slots</label>
        <select v-model="editSlotsValue" class="rounded-lg border border-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showSlotsModal = false">Cancel</AppButton>
        <AppButton variant="primary" @click="confirmEditSlots">Save</AppButton>
      </template>
    </AppModal>

    <AppModal :open="showPayoutModal" title="Confirm Payout" size="sm" @close="showPayoutModal = false">
      <p class="text-sm text-muted mb-4">
        Confirm that <span class="font-medium text-fg">{{ memberToPayout?.displayName }}</span> received the pot for Cycle {{ selectedCycle }}. Once confirmed, the next cycle can be started.
      </p>
      <AppAlert v-if="forcePayout" variant="warning" class="mb-4">
        <p><span class="font-medium">Note:</span> {{ unpaidDuesCount }} contributor{{ unpaidDuesCount === 1 ? ' has' : 's have' }} not paid yet. You are force-confirming the payout.</p>
      </AppAlert>
      <template #footer>
        <AppButton variant="secondary" @click="showPayoutModal = false">Cancel</AppButton>
        <AppButton :variant="forcePayout ? 'warning' : 'accent'" @click="confirmPayout">{{ forcePayout ? 'Force Confirm' : 'Confirm Payout' }}</AppButton>
      </template>
    </AppModal>

    <AppModal :open="showArchiveModal" title="Archive Group" @close="showArchiveModal = false">
      <p class="text-sm text-muted mb-4">
        Archive <span class="font-medium text-fg">{{ groupsStore.currentGroup?.name }}</span>? The group will be marked as completed and hidden from your active list. All contribution history is preserved.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showArchiveModal = false">Cancel</AppButton>
        <AppButton variant="danger" @click="handleArchive">Archive</AppButton>
      </template>
    </AppModal>

    <AppModal :open="showDeleteGroupModal" title="Delete Group" @close="showDeleteGroupModal = false">
      <p class="text-sm text-muted mb-4">
        Permanently delete <span class="font-medium text-fg">{{ groupsStore.currentGroup?.name }}</span>? This cannot be undone. The group has no contribution history.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showDeleteGroupModal = false">Cancel</AppButton>
        <AppButton variant="danger" @click="handleDeleteGroup">Delete Group</AppButton>
      </template>
    </AppModal>
  </div>
</template>
