<script setup>
import { ref, computed } from 'vue'

const filter = ref('all')

const notifications = [
  { id: 1, type: 'paid', message: 'Chidi Nwosu marked your contribution as paid for Cycle 6', read: false, time: '2 hours ago' },
  { id: 2, type: 'your_turn', message: 'You are next to receive the pot in Market Women Ajo', read: false, time: '1 day ago' },
  { id: 3, type: 'new_cycle', message: 'Cycle 6 has started for Family Savings group', read: true, time: '3 days ago' },
  { id: 4, type: 'paid', message: 'Amara Okafor was marked as paid for Cycle 5', read: true, time: '1 week ago' },
]

const filtered = computed(() => {
  if (filter.value === 'unread') return notifications.filter((n) => !n.read)
  return notifications
})


function icon(type) {
  if (type === 'paid') return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  if (type === 'your_turn') return 'M13 7V3a1 1 0 00-1-1H5a1 1 0 00-1 1v18a1 1 0 001 1h14a1 1 0 001-1V9a1 1 0 00-1-1h-4zM9 12l2 2 4-4'
  if (type === 'new_cycle') return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
  return ''
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Notifications</h1>

    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="filter = 'all'">All</button>
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="filter = 'unread'">Unread</button>
    </div>

    <div class="space-y-2">
      <div v-for="n in filtered" :key="n.id" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3" :class="{ 'border-l-4 border-l-primary-500': !n.read }">
        <div class="shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mt-0.5">
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icon(n.type)" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-900">{{ n.message }}</p>
          <p class="text-xs text-muted mt-0.5">{{ n.time }}</p>
        </div>
        <div v-if="!n.read" class="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-2" />
      </div>

      <div v-if="!filtered.length" class="text-center py-12 text-sm text-muted">No notifications</div>
    </div>
  </div>
</template>
