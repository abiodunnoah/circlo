<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, ChevronRight, Users as UsersIcon } from '@lucide/vue'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import AppMoney from '@/components/common/AppMoney.vue'
import AppAvatarGroup from '@/components/common/AppAvatarGroup.vue'

const router = useRouter()
const groupsStore = useGroupsStore()
const toast = useToast()

const search = ref('')
const filter = ref('all')

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return groupsStore.groups.filter((g) => {
    const matchesQuery = !q || g.name?.toLowerCase().includes(q)
    const status = g.status || 'active'
    const matchesFilter =
      filter.value === 'all'
        ? status !== 'archived'
        : filter.value === 'completed'
          ? status === 'completed'
          : status === 'active'
    return matchesQuery && matchesFilter
  })
})

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
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-fg">My Groups</h1>
        <p class="text-sm text-muted mt-1">All the savings circles you belong to.</p>
      </div>
      <AppButton variant="primary" @click="router.push({ name: 'CreateGroup' })">
        <Plus class="w-4 h-4" />
        Create group
      </AppButton>
    </div>

    <AppAlert
      v-if="groupsStore.error && !groupsStore.loading"
      variant="danger"
      title="Unable to load your groups"
      action-label="Try again"
      class="mb-6"
      @action="retryLoadGroups"
    >
      {{ groupsStore.error }}
    </AppAlert>

    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <div class="sm:max-w-xs w-full">
        <AppInput v-model="search" type="search" placeholder="Search groups">
          <template #trailing>
            <Search class="w-4 h-4 text-fg-4" />
          </template>
        </AppInput>
      </div>
      <AppTabs v-model="filter" :tabs="filters" />
    </div>

    <div v-if="groupsStore.loading" class="space-y-3">
      <AppCard v-for="i in 4" :key="i" padding="p-4">
        <div class="flex items-center gap-3">
          <AppSkeleton circle class="w-12 h-12 shrink-0" />
          <div class="flex-1">
            <AppSkeleton class="h-4 w-40 mb-2" />
            <AppSkeleton class="h-3 w-32" />
          </div>
        </div>
      </AppCard>
    </div>

    <div v-else-if="filtered.length" class="grid sm:grid-cols-2 gap-4">
      <AppCard
        v-for="g in filtered"
        :key="g.id"
        hover
        role="button"
        tabindex="0"
        class="cursor-pointer flex flex-col"
        @click="openGroup(g)"
        @keydown.enter="openGroup(g)"
        @keydown.space.prevent="openGroup(g)"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <h3 class="font-semibold text-fg truncate">{{ g.name }}</h3>
          <div class="flex flex-wrap justify-end gap-1.5 shrink-0">
            <AppStatusBadge v-if="g.membershipStatus === 'pending'" status="pending" label="Pending" />
            <AppStatusBadge v-else-if="g.membershipStatus === 'rejected'" status="rejected" label="Declined" />
            <AppStatusBadge v-else-if="g.status === 'completed'" status="default" label="Completed" />
            <AppStatusBadge v-else status="active" label="Active" />
          </div>
        </div>

        <p class="text-sm text-muted mb-3">
          <AppMoney :value="g.contributionAmount" size="md" class="text-fg" /> / {{ g.frequency }}
          &middot; {{ g.totalMembers }} members
        </p>

        <AppProgress
          :value="g.currentCycle"
          :max="g.totalSlots || g.totalMembers || 1"
          :label="`Cycle ${g.currentCycle} of ${g.totalSlots || g.totalMembers || 1}`"
          size="sm"
          class="mb-3"
        />

        <div class="mt-auto pt-3 border-t border-line flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <AppAvatarGroup v-if="g.memberSample?.length" :members="g.memberSample" :max="4" />
            <span v-else class="text-xs text-muted inline-flex items-center gap-1">
              <UsersIcon class="w-3.5 h-3.5" /> {{ g.totalMembers }}
            </span>
          </div>
          <ChevronRight class="w-4 h-4 text-muted shrink-0" />
        </div>
      </AppCard>
    </div>

    <AppCard v-else padding="p-0">
      <AppEmpty
        :title="search ? 'No matching groups' : 'No groups yet'"
        :description="
          search
            ? 'Try a different search term or filter.'
            : 'Create your first savings circle or join one using an invite link.'
        "
        :action-label="search ? '' : 'Create group'"
        @action="router.push({ name: 'CreateGroup' })"
      />
    </AppCard>
  </div>
</template>
