<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
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

function retryLoadGroups() {
  groupsStore.unsubscribeUserGroups()
  groupsStore.subscribeUserGroups()
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-fg">Groups</h1>
      <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'CreateGroup' })">Create Group</button>
    </div>

    <div class="flex gap-1 bg-line rounded-lg p-1 mb-6 w-fit">
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="tab === 'member' ? 'bg-card text-fg shadow-sm' : 'text-fg-3 hover:text-fg'" @click="tab = 'member'">My Groups</button>
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="tab === 'admin' ? 'bg-card text-fg shadow-sm' : 'text-fg-3 hover:text-fg'" @click="tab = 'admin'">Admin</button>
    </div>

    <div v-if="groupsStore.loading" aria-label="Loading..." aria-busy="true" class="space-y-3">
      <div v-for="i in 5" :key="i" class="bg-card rounded-xl border border-line shadow-sm p-4">
        <div class="flex items-center gap-3">
          <AppSkeleton circle class="w-12 h-12 shrink-0" />
          <div class="flex-1 min-w-0">
            <AppSkeleton class="h-4 w-40 mb-2" />
            <AppSkeleton class="h-3 w-32" />
          </div>
          <div class="text-right">
            <AppSkeleton class="h-4 w-16 mb-2 ml-auto" />
            <AppSkeleton class="h-3 w-20 ml-auto" />
          </div>
        </div>
        <AppSkeleton class="h-2 w-full rounded-full mt-3" />
      </div>
    </div>

    <AppAlert
      v-else-if="groupsStore.error && !groupsStore.groups.length"
      variant="danger"
      title="Couldn't load your groups"
      action-label="Try again"
      class="mb-6"
      @action="retryLoadGroups"
    >
      {{ groupsStore.error }}
    </AppAlert>

    <div v-else-if="tab === 'member'" class="space-y-3">
      <template v-if="memberGroups.length">
        <div
          v-for="g in memberGroups"
          :key="g.id"
          role="button"
          tabindex="0"
          class="bg-card rounded-xl border border-line shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
          @click="openGroup(g)"
          @keydown.enter="openGroup(g)"
          @keydown.space.prevent="openGroup(g)"
        >
          <div class="flex items-center gap-3">
            <AppAvatar :name="g.name" :id="g.id" size="lg" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-fg truncate">{{ g.name }}</h3>
                <AppStatusBadge v-if="g.membershipStatus === 'pending'" status="pending" label="Pending" />
                <AppStatusBadge v-else-if="g.membershipStatus === 'rejected'" status="rejected" label="Declined" />
              </div>
              <p class="text-sm text-muted">{{ g.frequency }} &middot; {{ g.totalMembers }} members</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-medium text-fg tabular-nums">Cycle {{ g.currentCycle }}</p>
              <p class="text-sm text-muted tabular-nums">{{ formatNaira(g.contributionAmount) }}/ea</p>
            </div>
            <ChevronRight class="w-4 h-4 text-muted shrink-0 hidden sm:block" />
          </div>
          <AppProgress
            :value="g.currentCycle"
            :max="g.totalSlots || g.totalMembers || 1"
            :label="`Rotation · Cycle ${g.currentCycle} of ${g.totalSlots || g.totalMembers || 1}`"
            size="sm"
            class="mt-3"
          />
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
        <div
          v-for="g in adminGroups"
          :key="g.id"
          role="button"
          tabindex="0"
          class="bg-card rounded-xl border border-line shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
          @click="router.push({ name: 'GroupDetail', params: { id: g.id } })"
          @keydown.enter="router.push({ name: 'GroupDetail', params: { id: g.id } })"
          @keydown.space.prevent="router.push({ name: 'GroupDetail', params: { id: g.id } })"
        >
          <div class="flex items-center gap-3">
            <AppAvatar :name="g.name" :id="g.id" size="lg" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-fg truncate">{{ g.name }}</h3>
                <span class="text-xs bg-accent-100 text-accent-700 rounded-full px-2 py-0.5 font-medium shrink-0">Admin</span>
              </div>
              <p class="text-sm text-muted">{{ g.frequency }} &middot; {{ g.totalMembers }} members</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-medium text-fg tabular-nums">Cycle {{ g.currentCycle }}</p>
              <p class="text-sm text-muted tabular-nums">{{ formatNaira(g.contributionAmount) }}/ea</p>
            </div>
            <ChevronRight class="w-4 h-4 text-muted shrink-0 hidden sm:block" />
          </div>
          <AppProgress
            :value="g.currentCycle"
            :max="g.totalSlots || g.totalMembers || 1"
            :label="`Rotation · Cycle ${g.currentCycle} of ${g.totalSlots || g.totalMembers || 1}`"
            size="sm"
            class="mt-3"
          />
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
