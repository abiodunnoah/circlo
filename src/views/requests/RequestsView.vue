<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppLoader from '@/components/common/AppLoader.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'

const router = useRouter()
const groupsStore = useGroupsStore()
const toast = useToast()

const groupedRequests = computed(() => {
  const byGroup = new Map()
  for (const r of groupsStore.pendingRequests) {
    if (!byGroup.has(r.groupId)) {
      byGroup.set(r.groupId, { groupId: r.groupId, groupName: r.groupName, members: [] })
    }
    byGroup.get(r.groupId).members.push(r.member)
  }
  return [...byGroup.values()]
})

async function handleApprove(groupId, member) {
  try {
    await groupsStore.approveMember(groupId, member.id)
    toast.show(`${member.displayName} approved`, 'success')
    await groupsStore.fetchPendingRequests()
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

async function handleReject(groupId, member) {
  try {
    await groupsStore.rejectMember(groupId, member.id)
    toast.show(`${member.displayName} rejected`, 'info')
    await groupsStore.fetchPendingRequests()
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function openGroup(groupId) {
  router.push({ name: 'GroupDetail', params: { id: groupId }, query: { tab: 'pending' } })
}

onMounted(() => {
  groupsStore.fetchPendingRequests()
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Join Requests</h1>
      <span
        v-if="groupsStore.pendingRequests.length"
        class="bg-accent-100 text-accent-700 text-sm font-medium rounded-full px-3 py-1"
      >
        {{ groupsStore.pendingRequests.length }} pending
      </span>
    </div>

    <div v-if="groupsStore.requestsLoading" class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <AppLoader text="Loading requests..." />
    </div>

    <div v-else-if="groupsStore.requestsError" class="bg-red-50 border border-red-200 rounded-xl p-4">
      <p class="text-sm font-medium text-red-800 mb-1">Couldn't load join requests</p>
      <p class="text-sm text-red-700 mb-2">{{ groupsStore.requestsError }}</p>
      <button class="text-sm font-medium text-red-700 underline cursor-pointer" @click="groupsStore.fetchPendingRequests()">Try again</button>
    </div>

    <div v-else-if="groupedRequests.length" class="space-y-4">
      <div v-for="group in groupedRequests" :key="group.groupId" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 class="font-semibold text-slate-900 truncate">{{ group.groupName }}</h2>
          <button class="text-xs text-primary-700 font-medium hover:text-primary-800 cursor-pointer shrink-0" @click="openGroup(group.groupId)">
            View group
          </button>
        </div>

        <div class="divide-y divide-slate-100">
          <div v-for="member in group.members" :key="member.id" class="flex items-center gap-4 px-5 py-3.5">
            <div class="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              {{ (member.displayName || member.email || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ member.displayName }}</p>
              <p class="text-xs text-muted truncate">{{ member.email }}</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button class="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 cursor-pointer" @click="handleApprove(group.groupId, member)">Approve</button>
              <button class="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-300 hover:bg-red-50 cursor-pointer" @click="handleReject(group.groupId, member)">Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <AppEmpty
        title="No pending requests"
        description="When someone uses your invite link to join a group you manage, their request will appear here."
        action-label="Go to your groups"
        @action="router.push({ name: 'GroupList' })"
      />
    </div>
  </div>
</template>
