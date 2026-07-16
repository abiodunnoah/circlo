<script setup>
import { ref } from 'vue'
import AppBadge from '@/components/common/AppBadge.vue'

const tab = ref('members')

const group = {
  name: 'Market Women Ajo',
  amount: 20000,
  freq: 'Weekly',
  totalCycle: 12,
  currentCycle: 6,
  status: 'active',
  adminId: 'you',
  inviteCode: 'aj0-m4rk3t-2025',
}

const members = [
  { name: 'Chidi Nwosu', order: 1, received: true, status: 'approved', email: 'chidi@example.com' },
  { name: 'Amara Okafor', order: 2, received: true, status: 'approved', email: 'amara@example.com' },
  { name: 'Tunde Balogun', order: 3, received: false, status: 'approved', email: 'tunde@example.com' },
  { name: 'Fatima Bello', order: 4, received: false, status: 'approved', email: 'fatima@example.com' },
  { name: 'Emeka Obi', order: 5, received: false, status: 'approved', email: 'emeka@example.com' },
  { name: 'Ngozi Eze', order: 6, received: false, status: 'approved', email: 'ngozi@example.com' },
]

const pendingRequests = [
  { name: 'Ifeanyi Okoro', email: 'ifeanyi@example.com' },
  { name: 'Sade Akinlade', email: 'sade@example.com' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ group.name }}</h1>
          <p class="text-sm text-muted mt-1">
            ₦{{ group.amount.toLocaleString() }}/{{ group.freq }} &middot; Cycle {{ group.currentCycle }}/{{ group.totalCycle }}
          </p>
        </div>
        <div class="flex gap-2">
          <button class="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer">Copy Invite Link</button>
          <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer">Start New Cycle</button>
        </div>
      </div>
    </div>

    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer" :class="tab === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="tab = 'members'">Members</button>
      <button class="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer relative" :class="tab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'" @click="tab = 'pending'">
        Pending
        <span v-if="pendingRequests.length" class="ml-1 bg-accent-500 text-white text-xs rounded-full px-1.5">{{ pendingRequests.length }}</span>
      </button>
    </div>

    <div v-if="tab === 'members'" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="divide-y divide-slate-100">
        <div v-for="m in members" :key="m.order" class="flex items-center gap-4 px-5 py-3.5">
          <span class="text-sm font-medium text-muted w-6">{{ m.order }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">{{ m.name }}</p>
            <p class="text-xs text-muted truncate">{{ m.email }}</p>
          </div>
          <AppBadge v-if="m.received" variant="received">Received</AppBadge>
          <AppBadge v-else-if="m.order === members.filter(x => !x.received)[0]?.order" variant="next">Next</AppBadge>
          <AppBadge v-else variant="default">Waiting</AppBadge>
        </div>
        <div v-if="!members.length" class="px-5 py-8 text-center text-sm text-muted">No members yet</div>
      </div>
    </div>

    <div v-if="tab === 'pending'" class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div class="divide-y divide-slate-100">
        <div v-for="(r, i) in pendingRequests" :key="i" class="flex items-center gap-4 px-5 py-3.5">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900">{{ r.name }}</p>
            <p class="text-xs text-muted">{{ r.email }}</p>
          </div>
          <div class="flex gap-2">
            <button class="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 cursor-pointer">Approve</button>
            <button class="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-300 hover:bg-red-50 cursor-pointer">Reject</button>
          </div>
        </div>
        <div v-if="!pendingRequests.length" class="px-5 py-8 text-center text-sm text-muted">No pending requests</div>
      </div>
    </div>
  </div>
</template>
