<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import { CheckCircle2, HandCoins, RefreshCw, ShieldCheck, Bell } from '@lucide/vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const notificationsStore = useNotificationsStore()

const filter = ref('all')

const ACTION_TYPES = ['your_turn', 'reminder']
const SYSTEM_TYPES = ['paid', 'new_cycle', 'approved']

const tabs = computed(() => [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread', badge: notificationsStore.unreadCount || undefined },
  { label: 'Actions', value: 'actions' },
  { label: 'System', value: 'system' },
])

const filtered = computed(() => {
  const list = notificationsStore.notifications
  if (filter.value === 'unread') return list.filter((n) => !n.read)
  if (filter.value === 'actions') return list.filter((n) => ACTION_TYPES.includes(n.type))
  if (filter.value === 'system') return list.filter((n) => SYSTEM_TYPES.includes(n.type))
  return list
})

const typeIcons = {
  paid: CheckCircle2,
  your_turn: HandCoins,
  new_cycle: RefreshCw,
  approved: ShieldCheck,
  reminder: Bell,
}

function icon(type) {
  return typeIcons[type] || Bell
}

async function openNotification(n) {
  if (!n.read) await notificationsStore.markAsRead(n.id)
  if (n.groupId) router.push({ name: 'GroupDetail', params: { id: n.groupId } })
}

function timeLabel(n) {
  if (!n.createdAt) return ''
  const ms = typeof n.createdAt.toMillis === 'function' ? n.createdAt.toMillis() : n.createdAt
  if (typeof ms === 'number' && Number.isFinite(ms)) return new Date(ms).toLocaleString()
  return ''
}

onMounted(() => {
  notificationsStore.subscribeNotifications()
})

onUnmounted(() => {
  notificationsStore.unsubscribeNotifications()
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
    <AppPageHeader title="Notifications" subtitle="Updates about your contributions, cycles and groups.">
      <template #actions>
        <AppButton
          v-if="notificationsStore.unreadCount > 0"
          variant="secondary"
          size="sm"
          @click="notificationsStore.markAllAsRead()"
        >
          Mark all as read
        </AppButton>
      </template>
    </AppPageHeader>

    <AppTabs v-model="filter" :tabs="tabs" class="mb-6" />

    <div v-if="notificationsStore.loading" aria-label="Loading..." aria-busy="true" class="space-y-2">
      <AppCard v-for="i in 5" :key="i" padding="p-4" class="flex items-start gap-3">
        <AppSkeleton circle class="w-8 h-8 mt-0.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <AppSkeleton class="h-3.5 w-3/4 mb-1.5" />
          <AppSkeleton class="h-3 w-24" />
        </div>
      </AppCard>
    </div>

    <div v-else-if="filtered.length" class="space-y-2">
      <button
        v-for="n in filtered"
        :key="n.id"
        class="w-full text-left bg-card rounded-xl border border-line shadow-sm p-4 flex items-start gap-3 hover:bg-line-subtle cursor-pointer transition-colors"
        :class="{ 'border-l-4 border-l-primary-500': !n.read }"
        @click="openNotification(n)"
      >
        <span
          class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
          :class="n.read ? 'bg-line text-fg-4' : 'bg-primary-50 text-primary-600'"
        >
          <component :is="icon(n.type)" class="w-4 h-4" />
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm text-fg break-words" :class="{ 'font-medium': !n.read }">
            {{ n.message }}
          </span>
          <span class="block text-xs text-muted mt-0.5">{{ timeLabel(n) }}</span>
        </span>
        <span v-if="!n.read" class="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-2" aria-hidden="true" />
      </button>
    </div>

    <AppCard v-else padding="p-0">
      <AppEmpty
        title="No notifications"
        :description="
          filter === 'all'
            ? 'Updates about your contributions, cycles, and groups will show up here.'
            : 'Nothing in this filter right now.'
        "
      />
    </AppCard>
  </div>
</template>
