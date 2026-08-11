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

async function handleMarkPaid(member) {
  if (!member) return
  try {
    await contributionsStore.markAsPaid(groupId, member.userId, selectedCycle.value)
    toast.show(`${member.displayName} marked as paid`, 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleConfirmPayout(member) {
  if (!member) return
  try {
    await contributionsStore.confirmPayout(groupId, member.id, selectedCycle.value)
    toast.show(`Payout confirmed for ${member.displayName}`, 'success')
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
              ₦{{ Number(groupsStore.currentGroup.contributionAmount).toLocaleString() }}/{{ groupsStore.currentGroup.frequency }}
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
                <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ row.contribution ? '₦' + Number(row.contribution.amount || 0).toLocaleString() : '₦' + Number(groupsStore.currentGroup.contributionAmount || 0).toLocaleString() }}</td>
                <td class="px-5 py-3 text-muted hidden md:table-cell">{{ row.contribution?.paidAt ? new Date(row.contribution.paidAt.toMillis ? row.contribution.paidAt.toMillis() : row.contribution.paidAt).toLocaleDateString() : '—' }}</td>
                <td v-if="isAdmin" class="px-5 py-3 text-right">
                  <button v-if="!row.isPaid && !row.isVoid" class="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 cursor-pointer" @click="handleMarkPaid(row.member)">Mark Paid</button>
                  <button v-else-if="row.isPaid" class="text-xs text-red-600 hover:text-red-700 cursor-pointer" @click="handleVoid(row.member)">Void</button>
                  <button v-if="!row.member.hasReceived && row.member.id === groupsStore.currentGroup?.currentCycleRecipientId" class="ml-2 bg-accent-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-700 cursor-pointer" @click="handleConfirmPayout(row.member)">Confirm Payout</button>
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
  </div>
</template>
