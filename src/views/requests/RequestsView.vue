<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'

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
      <h1 class="text-2xl font-bold text-fg">Join Requests</h1>
      <span
        v-if="groupsStore.pendingRequests.length"
        class="bg-accent-100 text-accent-700 text-sm font-medium rounded-full px-3 py-1"
      >
        {{ groupsStore.pendingRequests.length }} pending
      </span>
    </div>

    <div v-if="groupsStore.requestsLoading" aria-label="Loading..." aria-busy="true" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-card rounded-xl border border-line shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-line-subtle bg-line-subtle">
          <AppSkeleton class="h-4 w-32" />
        </div>
        <div class="divide-y divide-line-subtle">
          <div v-for="j in 2" :key="j" class="flex items-center gap-4 px-5 py-3.5">
            <AppSkeleton circle class="h-9 w-9 shrink-0" />
            <div class="flex-1 min-w-0">
              <AppSkeleton class="h-3.5 w-28 mb-1.5" />
              <AppSkeleton class="h-3 w-36" />
            </div>
            <div class="flex gap-2 shrink-0">
              <AppSkeleton class="h-7 w-16 rounded-lg" />
              <AppSkeleton class="h-7 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppAlert
      v-else-if="groupsStore.requestsError"
      variant="danger"
      title="Couldn't load join requests"
      action-label="Try again"
      @action="groupsStore.fetchPendingRequests()"
    >
      {{ groupsStore.requestsError }}
    </AppAlert>

    <div v-else-if="groupedRequests.length" class="space-y-4">
      <div v-for="group in groupedRequests" :key="group.groupId" class="bg-card rounded-xl border border-line shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-line-subtle bg-line-subtle">
          <h2 class="font-semibold text-fg truncate">{{ group.groupName }}</h2>
          <button class="text-xs text-primary-700 font-medium hover:text-primary-800 cursor-pointer shrink-0" @click="openGroup(group.groupId)">
            View group
          </button>
        </div>

        <div class="divide-y divide-line-subtle">
          <div v-for="member in group.members" :key="member.id" class="flex items-center gap-4 px-5 py-3.5">
            <AppAvatar :name="member.displayName || member.email" :id="member.id" size="md" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-fg truncate">{{ member.displayName }}</p>
              <p class="text-xs text-muted truncate">{{ member.email }}</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button class="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 cursor-pointer" @click="handleApprove(group.groupId, member)">Approve</button>
              <button class="bg-card text-danger-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-danger-300 hover:bg-danger-50 cursor-pointer" @click="handleReject(group.groupId, member)">Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-card rounded-xl border border-line shadow-sm">
      <AppEmpty
        title="No pending requests"
        description="When someone uses your invite link to join a group you manage, their request will appear here."
        action-label="Go to your groups"
        @action="router.push({ name: 'GroupList' })"
      />
    </div>
  </div>
</template>
