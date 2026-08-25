<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppLoader from '@/components/common/AppLoader.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import { formatNaira } from '@/utils/format'

const router = useRouter()
const groupsStore = useGroupsStore()
const toast = useToast()

const tab = ref('member')

const memberGroups = computed(() => groupsStore.groups.filter((g) => g.role === 'member'))
const adminGroups = computed(() => groupsStore.groups.filter((g) => g.role === 'admin'))

function openGroup(g) {
  if (g.membershipStatus === 'pending') {
    toast.show('Your request is awaiting admin approval', 'info')
    return
  }
  if (g.membershipStatus === 'rejected') {
    toast.show('Your request was declined by the admin', 'info')
    return
  }
  router.push({ name: 'GroupDetail', params: { id: g.id } })
}

onMounted(() => {
  groupsStore.fetchUserGroups()
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Groups</h1>
      <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'CreateGroup' })">Create Group</button>
    </div>

    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="tab === 'member' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="tab = 'member'">My Groups</button>
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="tab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="tab = 'admin'">Admin</button>
    </div>

    <div v-if="groupsStore.loading" class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <AppLoader text="Loading groups..." />
    </div>

    <div v-else-if="groupsStore.error && !groupsStore.groups.length" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <p class="text-sm font-medium text-red-800 mb-1">Couldn't load your groups</p>
      <p class="text-sm text-red-700 mb-2">{{ groupsStore.error }}</p>
      <button class="text-sm font-medium text-red-700 underline cursor-pointer" @click="groupsStore.fetchUserGroups()">Try again</button>
    </div>

    <div v-else-if="tab === 'member'" class="space-y-3">
      <template v-if="memberGroups.length">
        <div v-for="g in memberGroups" :key="g.id" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" @click="openGroup(g)">
          <div>
            <h3 class="font-semibold text-slate-900">
              {{ g.name }}
              <span v-if="g.membershipStatus === 'pending'" class="ml-2 text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 font-medium align-middle">Pending approval</span>
              <span v-else-if="g.membershipStatus === 'rejected'" class="ml-2 text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5 font-medium align-middle">Declined</span>
            </h3>
            <p class="text-sm text-muted">{{ g.frequency }} &middot; {{ g.totalMembers }} members</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium">Cycle {{ g.currentCycle }}</p>
            <p class="text-sm text-muted">{{ formatNaira(g.contributionAmount) }}/ea</p>
          </div>
        </div>
      </template>
      <AppEmpty
        v-else
        title="No groups yet"
        description="Join a group using an invite link from your group admin."
        action-label="Browse groups"
        @action="router.push({ name: 'Dashboard' })"
      />
    </div>

    <div v-else class="space-y-3">
      <template v-if="adminGroups.length">
        <div v-for="g in adminGroups" :key="g.id" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" @click="router.push({ name: 'GroupDetail', params: { id: g.id } })">
          <div>
            <h3 class="font-semibold text-slate-900">{{ g.name }}</h3>
            <p class="text-sm text-muted">{{ g.frequency }} &middot; {{ g.totalMembers }} members</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium">Cycle {{ g.currentCycle }}</p>
            <p class="text-sm text-muted">{{ formatNaira(g.contributionAmount) }}/ea</p>
          </div>
        </div>
      </template>
      <AppEmpty
        v-else
        title="You don't manage any groups"
        description="Create a group to start your own savings circle."
        action-label="Create a Group"
        @action="router.push({ name: 'CreateGroup' })"
      />
    </div>
  </div>
</template>
