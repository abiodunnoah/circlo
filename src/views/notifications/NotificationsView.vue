<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import AppLoader from '@/components/common/AppLoader.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'

const router = useRouter()
const notificationsStore = useNotificationsStore()

const filter = ref('all')

const filtered = computed(() => {
  const list = notificationsStore.notifications
  if (filter.value === 'unread') return list.filter((n) => !n.read)
  return list
})

function icon(type) {
  if (type === 'paid') return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  if (type === 'your_turn') return 'M13 7V3a1 1 0 00-1-1H5a1 1 0 00-1 1v18a1 1 0 001 1h14a1 1 0 001-1V9a1 1 0 00-1-1h-4zM9 12l2 2 4-4'
  if (type === 'new_cycle') return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
  if (type === 'approved') return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  return ''
}

async function openNotification(n) {
  if (!n.read) {
    await notificationsStore.markAsRead(n.id)
  }
  if (n.groupId) {
    router.push({ name: 'GroupDetail', params: { id: n.groupId } })
  }
}

function timeLabel(n) {
  if (!n.createdAt) return ''
  const ms = typeof n.createdAt.toMillis === 'function' ? n.createdAt.toMillis() : n.createdAt
  if (typeof ms === 'number' && Number.isFinite(ms)) {
    return new Date(ms).toLocaleString()
  }
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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Notifications</h1>
      <button
        v-if="notificationsStore.unreadCount > 0"
        class="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
        @click="notificationsStore.markAllAsRead()"
      >
        Mark all as read
      </button>
    </div>

    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="filter = 'all'">All</button>
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="filter = 'unread'">Unread</button>
    </div>

    <div v-if="notificationsStore.loading" class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <AppLoader text="Loading notifications..." />
    </div>

    <div v-else-if="filtered.length" class="space-y-2">
      <button
        v-for="n in filtered"
        :key="n.id"
        class="w-full text-left bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer"
        :class="{ 'border-l-4 border-l-primary-500': !n.read }"
        @click="openNotification(n)"
      >
        <div class="shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mt-0.5">
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icon(n.type)" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-900" :class="{ 'font-medium': !n.read }">{{ n.message }}</p>
          <p class="text-xs text-muted mt-0.5">{{ timeLabel(n) }}</p>
        </div>
        <div v-if="!n.read" class="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-2" />
      </button>
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <AppEmpty
        title="No notifications"
        description="Updates about your contributions, cycles, and groups will show up here."
      />
    </div>
  </div>
</template>