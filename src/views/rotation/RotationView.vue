<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { RefreshCw, ChevronRight } from '@lucide/vue'
import AppCard from '@/components/common/AppCard.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'

const router = useRouter()
const groupsStore = useGroupsStore()

const groups = computed(() =>
  groupsStore.groups.filter((g) => g.role === 'admin' || g.membershipStatus === 'approved'),
)

onMounted(() => {
  if (!groupsStore.groups.length) groupsStore.fetchUserGroups()
})

function open(g) {
  router.push({ name: 'GroupDetail', params: { id: g.id }, query: { tab: 'rotation' } })
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <div class="flex items-center gap-3 mb-1">
      <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
        <RefreshCw class="w-5 h-5" />
      </span>
      <h1 class="text-2xl font-bold text-fg">Rotation</h1>
    </div>
    <p class="text-sm text-muted mb-6">Select a group to view its payout rotation and order.</p>

    <div v-if="groupsStore.loading" class="space-y-3">
      <AppCard v-for="i in 3" :key="i" padding="p-4">
        <div class="flex items-center gap-3">
          <AppSkeleton circle class="w-12 h-12 shrink-0" />
          <div class="flex-1">
            <AppSkeleton class="h-4 w-40 mb-2" />
            <AppSkeleton class="h-3 w-28" />
          </div>
        </div>
      </AppCard>
    </div>

    <div v-else-if="groups.length" class="grid sm:grid-cols-2 gap-4">
      <AppCard
        v-for="g in groups"
        :key="g.id"
        hover
        role="button"
        tabindex="0"
        class="cursor-pointer"
        @click="open(g)"
        @keydown.enter="open(g)"
        @keydown.space.prevent="open(g)"
      >
        <div class="flex items-center gap-3">
          <AppAvatar :name="g.name" :id="g.id" size="lg" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-fg truncate">{{ g.name }}</h3>
              <AppStatusBadge v-if="g.role === 'admin'" status="active" label="Admin" />
            </div>
            <p class="text-sm text-muted truncate">
              Cycle {{ g.currentCycle }} of {{ g.totalSlots || g.totalMembers || 1 }}
              &middot; {{ g.totalMembers }} members
            </p>
          </div>
          <ChevronRight class="w-4 h-4 text-muted shrink-0" />
        </div>
      </AppCard>
    </div>

    <AppCard v-else padding="p-0">
      <AppEmpty
        title="No groups yet"
        description="Create a savings circle or join one with an invite link to track its rotation."
        action-label="Create group"
        @action="router.push({ name: 'CreateGroup' })"
      />
    </AppCard>
  </div>
</template>
