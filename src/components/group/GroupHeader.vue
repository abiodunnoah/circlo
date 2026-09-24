<script setup>
import AppBackButton from '@/components/common/AppBackButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import AppIconButton from '@/components/common/AppIconButton.vue'
import { MoreVertical, UserPlus, Link2, Settings } from '@lucide/vue'
import { formatNaira } from '@/utils/format'

defineProps({
  group: { type: Object, required: true },
  isAdmin: { type: Boolean, default: false },
  progress: { type: Object, default: () => ({}) },
})

defineEmits(['invite', 'copy-invite', 'settings'])
</script>

<template>
  <div>
    <AppBackButton :fallback="{ name: 'GroupList' }" />
    <AppCard class="mb-6">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-bold text-fg break-words">{{ group.name }}</h1>
            <AppStatusBadge v-if="group.status === 'completed'" status="default" label="Completed" />
            <AppStatusBadge v-else status="active" />
          </div>
          <p class="text-sm text-muted mt-1">
            {{ formatNaira(group.contributionAmount) }}/{{ group.frequency }}
            &middot; {{ group.totalMembers }} members
            &middot; Cycle {{ group.currentCycle }}
          </p>
          <p v-if="isAdmin" class="text-xs text-primary-600 font-medium mt-1">You are the admin</p>
        </div>
        <div v-if="isAdmin" class="shrink-0">
          <AppDropdown>
            <template #trigger>
              <AppIconButton label="Group actions">
                <MoreVertical class="w-5 h-5" />
              </AppIconButton>
            </template>
            <button
              v-if="isAdmin"
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-fg-2 hover:bg-line-subtle cursor-pointer"
              @click="$emit('invite')"
            >
              <UserPlus class="w-4 h-4 text-fg-4" />
              Invite members
            </button>
            <button
              v-if="isAdmin"
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-fg-2 hover:bg-line-subtle cursor-pointer"
              @click="$emit('copy-invite')"
            >
              <Link2 class="w-4 h-4 text-fg-4" />
              Copy invite link
            </button>
            <button
              v-if="isAdmin"
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-fg-2 hover:bg-line-subtle cursor-pointer"
              @click="$emit('settings')"
            >
              <Settings class="w-4 h-4 text-fg-4" />
              Settings
            </button>
          </AppDropdown>
        </div>
      </div>
      <div class="mt-4">
        <AppProgress
          :value="progress.value || 0"
          :max="progress.max || 1"
          :label="progress.label || ''"
        />
      </div>
    </AppCard>
  </div>
</template>
