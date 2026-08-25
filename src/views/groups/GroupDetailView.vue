<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useContributionsStore } from '@/stores/contributions'
import { useToast } from '@/composables/useToast'
import AppBadge from '@/components/common/AppBadge.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import AppModal from '@/components/common/AppModal.vue'
import { formatNaira } from '@/utils/format'

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

const selectedCycle = ref(0)
const cycleOptions = ref([])
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

const eligibleMembers = computed(() =>
  groupsStore.approvedMembers.filter((m) => (m.joinedCycle ?? 1) <= Math.max(currentCycle.value, 1)),
)

const rotationConcluded = computed(() =>
  eligibleMembers.value.length > 0 && eligibleMembers.value.every((m) => m.hasReceived),
)

const cycleConcluded = computed(() => {
  if (currentCycle.value === 0) return true
  const recipientId = groupsStore.currentGroup?.currentCycleRecipientId
  if (!recipientId) return true
  const recipient = groupsStore.approvedMembers.find((m) => m.id === recipientId)
  return recipient ? recipient.hasReceived : false
})

const canStartCycle = computed(() => isAdmin.value && cycleConcluded.value)

const canRemoveMembers = computed(() => isAdmin.value && rotationConcluded.value)

const canReorder = computed(() => isAdmin.value && (currentCycle.value === 0 || rotationConcluded.value))

function canMove(member, direction) {
  const list = groupsStore.approvedMembers
  const index = list.findIndex((m) => m.id === member.id)
  if (index === -1) return false
  if (direction === 'up') return index > 0
  return index < list.length - 1
}

const nextMember = computed(() => {
  const unreceived = eligibleMembers.value
    .filter((m) => !m.hasReceived)
    .sort((a, b) => a.rotationOrder - b.rotationOrder)
  return unreceived[0]
})

const cycleContributions = computed(() => {
  if (!contributionsStore.contributionsByMember) return {}
  return contributionsStore.contributionsByMember
})

const contributionRows = computed(() => {
  const rows = eligibleMembers.value.map((m) => ({
    member: m,
    contribution: cycleContributions.value[m.id] || null,
    isVoid: cycleContributions.value[m.id]?.status === 'void',
    isPaid: cycleContributions.value[m.id]?.status === 'paid',
  }))
  if (!isAdmin.value) {
    const uid = authStore.user?.uid
    return rows.filter((r) => r.member.userId === uid)
  }
  return rows
})

const contributionStats = computed(() => {
  const paid = contributionRows.value.filter((r) => r.isPaid && !r.isVoid).length
  const total = contributionRows.value.length
  return { paid, total }
})

const unpaidDuesCount = computed(() => {
  if (selectedCycle.value !== currentCycle.value) return 0
  return contributionRows.value.filter((r) => !r.isPaid && !r.isVoid).length
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
    await groupsStore.approveMember(groupId, member.id)
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

function openPayoutModal(member) {
  memberToPayout.value = member
  showPayoutModal.value = true
}

async function confirmPayout() {
  if (!memberToPayout.value) return
  try {
    await contributionsStore.confirmPayout(groupId, memberToPayout.value.id, selectedCycle.value)
    toast.show(`Payout confirmed for ${memberToPayout.value.displayName}`, 'success')
    showPayoutModal.value = false
    memberToPayout.value = null
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

async function handleMove(member, direction) {
  if (!member) return
  try {
    await groupsStore.moveMemberRotation(groupId, member.id, direction)
    toast.show(`${member.displayName} moved ${direction === 'up' ? 'up' : 'down'} in rotation`, 'success')
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
    <div v-if="groupsStore.currentGroupStatus === 'loading'">
      <AppLoader text="Loading group..." />
    </div>

    <div v-else-if="groupsStore.currentGroupStatus === 'ready' && groupsStore.currentGroup">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">{{ groupsStore.currentGroup.name }}</h1>
            <p class="text-sm text-muted mt-1">
              {{ formatNaira(groupsStore.currentGroup.contributionAmount) }}/{{ groupsStore.currentGroup.frequency }}
              &middot; Cycle {{ groupsStore.currentGroup.currentCycle }}
              &middot; {{ groupsStore.currentGroup.totalMembers }} members
            </p>
            <p v-if="isAdmin" class="text-xs text-accent-600 font-medium mt-1">You are the admin</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-if="isAdmin" class="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer" @click="copyInviteLink">Copy Invite Link</button>
            <button
              v-if="isAdmin"
              class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canStartCycle"
              :title="canStartCycle ? '' : 'Finish the current cycle before starting a new one'"
              @click="showCycleModal = true"
            >
              Start New Cycle
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
        <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="tab === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="tab = 'members'">Members</button>
        <button v-if="isAdmin" class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer relative" :class="tab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="tab = 'pending'">
          Pending
          <span v-if="groupsStore.pendingMembers.length" class="ml-1 bg-accent-500 text-white text-xs rounded-full px-1.5">{{ groupsStore.pendingMembers.length }}</span>
        </button>
        <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="tab === 'contributions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="tab = 'contributions'">Contributions</button>
      </div>

      <div v-if="tab === 'members'" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="divide-y divide-slate-100">
          <div v-for="m in groupsStore.approvedMembers" :key="m.id" class="flex items-center gap-4 px-5 py-3.5">
            <span class="text-sm font-medium text-muted w-6">{{ m.rotationOrder }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">
                {{ m.displayName }}
                <span v-if="m.userId === groupsStore.currentGroup.adminId" class="text-xs text-accent-600 font-medium">(admin)</span>
              </p>
              <p class="text-xs text-muted truncate">{{ m.email }}</p>
            </div>
            <template v-if="(m.joinedCycle ?? 1) > currentCycle">
              <AppBadge variant="default">Joins cycle {{ m.joinedCycle }}</AppBadge>
            </template>
            <template v-else>
              <AppBadge v-if="m.hasReceived" variant="received">Received</AppBadge>
              <AppBadge v-else-if="nextMember?.id === m.id" variant="next">Next</AppBadge>
              <AppBadge v-else variant="default">Waiting</AppBadge>
            </template>
            <div v-if="isAdmin && canReorder" class="flex flex-col gap-0.5">
              <button :disabled="!canMove(m, 'up')" class="text-[10px] leading-none text-slate-500 hover:text-primary-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" title="Move up in rotation" @click="handleMove(m, 'up')">▲</button>
              <button :disabled="!canMove(m, 'down')" class="text-[10px] leading-none text-slate-500 hover:text-primary-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" title="Move down in rotation" @click="handleMove(m, 'down')">▼</button>
            </div>
            <button v-if="isAdmin && canRemoveMembers && m.userId !== groupsStore.currentGroup.adminId" class="text-xs text-red-600 hover:text-red-700 cursor-pointer" @click="openRemoveModal(m)">Remove</button>
          </div>
          <div v-if="!groupsStore.approvedMembers.length" class="px-5 py-8 text-center text-sm text-muted">No members yet</div>
        </div>
      </div>

      <div v-if="tab === 'pending'" class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="divide-y divide-slate-100">
          <div v-for="r in groupsStore.pendingMembers" :key="r.id" class="flex items-center gap-4 px-5 py-3.5">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900">{{ r.displayName }}</p>
              <p class="text-xs text-muted">{{ r.email }}</p>
            </div>
            <div class="flex gap-2">
              <button class="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 cursor-pointer" @click="handleApprove(r)">Approve</button>
              <button class="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-300 hover:bg-red-50 cursor-pointer" @click="handleReject(r)">Reject</button>
            </div>
          </div>
          <div v-if="!groupsStore.pendingMembers.length" class="px-5 py-8 text-center text-sm text-muted">No pending requests</div>
        </div>
      </div>

      <div v-if="tab === 'contributions'" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-slate-700">Cycle</p>
            <select v-model="selectedCycle" class="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="c in cycleOptions" :key="c" :value="c">Cycle {{ c }}</option>
            </select>
          </div>
          <p class="text-sm text-muted">{{ contributionStats.paid }} of {{ contributionStats.total }} paid</p>
        </div>

        <div v-if="unpaidDuesCount > 0 && isAdmin" class="bg-amber-50 border-b border-amber-200 px-5 py-3 text-sm text-amber-800">
          ⚠ {{ unpaidDuesCount }} contributor{{ unpaidDuesCount === 1 ? '' : 's' }} haven't paid for this cycle yet. You can still start the next cycle, but remind them to pay.
        </div>

        <div v-if="currentCycle === 0" class="px-5 py-10 text-center text-sm text-muted">
          No cycles yet. {{ isAdmin ? 'Start the first cycle to begin collecting contributions.' : 'Waiting for the admin to start the first cycle.' }}
        </div>

        <div v-else-if="contributionsStore.contributionsLoading" class="px-5 py-10 text-center">
          <AppLoader text="Loading contributions..." />
        </div>

        <div v-else-if="contributionRows.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left">
                <th class="px-5 py-3 font-medium text-muted">Member</th>
                <th class="px-5 py-3 font-medium text-muted">Status</th>
                <th class="px-5 py-3 font-medium text-muted hidden sm:table-cell">Amount</th>
                <th class="px-5 py-3 font-medium text-muted hidden md:table-cell">Date Paid</th>
                <th v-if="isAdmin" class="px-5 py-3 font-medium text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in contributionRows" :key="row.member.id" class="hover:bg-slate-50">
                <td class="px-5 py-3 font-medium text-slate-900">{{ row.member.displayName }}</td>
                <td class="px-5 py-3">
                  <AppBadge v-if="row.isVoid" variant="void">Voided</AppBadge>
                  <AppBadge v-else-if="row.isPaid" variant="paid">Paid</AppBadge>
                  <AppBadge v-else variant="pending">Unpaid</AppBadge>
                </td>
                <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ row.contribution ? formatNaira(row.contribution.amount) : formatNaira(groupsStore.currentGroup.contributionAmount) }}</td>
                <td class="px-5 py-3 text-muted hidden md:table-cell">{{ row.contribution?.paidAt ? new Date(row.contribution.paidAt.toMillis ? row.contribution.paidAt.toMillis() : row.contribution.paidAt).toLocaleDateString() : '—' }}</td>
                <td v-if="isAdmin" class="px-5 py-3 text-right">
                  <button v-if="!row.isPaid && !row.isVoid" class="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 cursor-pointer" @click="openMarkPaidModal(row.member)">Mark Paid</button>
                  <button v-else-if="row.isPaid" class="text-xs text-red-600 hover:text-red-700 cursor-pointer" @click="handleVoid(row.member)">Void</button>
                  <button v-if="!row.member.hasReceived && row.member.id === groupsStore.currentGroup?.currentCycleRecipientId" class="ml-2 bg-accent-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-700 cursor-pointer" @click="openPayoutModal(row.member)">Confirm Payout</button>
                  <button v-if="row.member.hasReceived && row.member.id === groupsStore.currentGroup?.currentCycleRecipientId" class="ml-2 text-xs text-accent-700 hover:text-accent-800 cursor-pointer" @click="handleUndoPayout(row.member)">Undo Payout</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="px-5 py-10 text-center text-sm text-muted">
          {{ isAdmin ? 'No eligible members yet. Approve members to start collecting contributions.' : 'You are not part of the active rotation yet.' }}
        </div>
      </div>
    </div>

    <div v-else-if="groupsStore.currentGroupStatus === 'not_found'" class="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
      <p class="text-sm text-muted mb-4">This group doesn't exist or you don't have access to it.</p>
      <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'GroupList' })">Back to Groups</button>
    </div>

    <div v-else-if="groupsStore.currentGroupStatus === 'error'" class="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
      <p class="text-sm text-muted mb-1">Something went wrong</p>
      <p class="text-sm text-red-600 mb-4">{{ groupsStore.error }}</p>
      <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'GroupList' })">Back to Groups</button>
    </div>

    <AppModal :open="showInviteModal" title="Invite Members" @close="showInviteModal = false">
      <p class="text-sm text-muted mb-3">Share this link with your members. Anyone with the link can request to join.</p>
      <div class="flex gap-2">
        <input :value="inviteLink" readonly class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50" />
        <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="copyToClipboard">Copy</button>
      </div>
      <button class="mt-3 w-full bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 cursor-pointer flex items-center justify-center gap-2" @click="shareToWhatsApp">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Share on WhatsApp
      </button>
    </AppModal>

    <AppModal :open="showCycleModal" title="Start New Cycle" @close="showCycleModal = false">
      <p class="text-sm text-muted mb-4">
        This advances the group to Cycle {{ (groupsStore.currentGroup?.currentCycle || 0) + 1 }}. The next member in rotation receives the pot for this cycle, and all eligible members contribute. When every eligible member has received once, a new rotation begins and "received" status resets.
      </p>
      <div class="flex justify-end gap-2">
        <button class="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer" @click="showCycleModal = false">Cancel</button>
        <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!canStartCycle" @click="handleStartCycle">Start Cycle</button>
      </div>
    </AppModal>

    <AppModal :open="showRemoveModal" title="Remove Member" @close="showRemoveModal = false">
      <p class="text-sm text-muted mb-4">
        Remove <span class="font-medium text-slate-900">{{ memberToRemove?.displayName }}</span> from this group? Their contribution history will be preserved.
      </p>
      <div class="flex justify-end gap-2">
        <button class="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer" @click="showRemoveModal = false">Cancel</button>
        <button class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer" @click="handleRemove">Remove</button>
      </div>
    </AppModal>

    <AppModal :open="showMarkPaidModal" title="Mark as Paid" size="sm" @close="showMarkPaidModal = false">
      <p class="text-sm text-muted mb-4">
        Confirm that <span class="font-medium text-slate-900">{{ memberToMarkPaid?.displayName }}</span> paid
        <span class="font-medium text-slate-900">{{ formatNaira(groupsStore.currentGroup?.contributionAmount) }}</span> for Cycle {{ selectedCycle }}.
      </p>
      <div class="flex justify-end gap-2">
        <button class="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer" @click="showMarkPaidModal = false">Cancel</button>
        <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="confirmMarkPaid">Mark Paid</button>
      </div>
    </AppModal>

    <AppModal :open="showPayoutModal" title="Confirm Payout" size="sm" @close="showPayoutModal = false">
      <p class="text-sm text-muted mb-4">
        Confirm that <span class="font-medium text-slate-900">{{ memberToPayout?.displayName }}</span> received the pot for Cycle {{ selectedCycle }}. Once confirmed, the next cycle can be started.
      </p>
      <div class="flex justify-end gap-2">
        <button class="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer" @click="showPayoutModal = false">Cancel</button>
        <button class="bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-700 cursor-pointer" @click="confirmPayout">Confirm Payout</button>
      </div>
    </AppModal>
  </div>
</template>
