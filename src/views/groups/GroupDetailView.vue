<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppBadge from '@/components/common/AppBadge.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import AppModal from '@/components/common/AppModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const toast = useToast()

const groupId = route.params.id
const tab = ref(route.query.tab === 'pending' ? 'pending' : 'members')
const inviteLink = ref('')
const showInviteModal = ref(false)
const showRemoveModal = ref(false)
const memberToRemove = ref(null)
const showCycleModal = ref(false)

let unsubscribe = null

onMounted(() => {
  unsubscribe = groupsStore.subscribeToGroup(groupId)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const isAdmin = computed(() => groupsStore.currentGroup?.adminId === authStore.user?.uid)

const currentCycle = computed(() => groupsStore.currentGroup?.currentCycle || 0)

const eligibleMembers = computed(() =>
  groupsStore.approvedMembers.filter((m) => (m.joinedCycle ?? 1) <= Math.max(currentCycle.value, 1)),
)

const cycleConcluded = computed(() => {
  if (currentCycle.value === 0) return true
  return eligibleMembers.value.length > 0 && eligibleMembers.value.every((m) => m.hasReceived)
})

const canStartCycle = computed(() => isAdmin.value && cycleConcluded.value)

const canRemoveMembers = computed(() => isAdmin.value && cycleConcluded.value)

const nextMember = computed(() => {
  const unreceived = eligibleMembers.value
    .filter((m) => !m.hasReceived)
    .sort((a, b) => a.rotationOrder - b.rotationOrder)
  return unreceived[0]
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

async function handleMarkReceived(member) {
  if (!member) return
  try {
    await groupsStore.markMemberReceived(groupId, member.id)
    toast.show(`${member.displayName} received the pot`, 'success')
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

        <div v-if="isAdmin && !cycleConcluded && eligibleMembers.length" class="px-5 py-4 border-t border-slate-100">
          <p class="text-xs text-muted mb-2">Mark a member as having received the pot this cycle:</p>
          <select class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-full sm:w-auto" @change="handleMarkReceived(eligibleMembers.find((m) => m.id === $event.target.value))">
            <option value="">Select member...</option>
            <option v-for="m in eligibleMembers.filter((x) => !x.hasReceived)" :key="m.id" :value="m.id">{{ m.displayName }}</option>
          </select>
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
        This will start Cycle {{ (groupsStore.currentGroup?.currentCycle || 0) + 1 }} and reset all eligible members' "received" status. Members approved during the last cycle will enter the rotation now.
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
