<script setup>
import { useRouter } from 'vue-router'
import AppCard from '@/components/common/AppCard.vue'

const router = useRouter()

const stats = [
  { label: 'Active Groups', value: '3' },
  { label: 'Total Contributed', value: '₦245,000' },
  { label: 'Next Payout', value: 'Amara Okafor' },
  { label: 'Pending Requests', value: '2' },
]

const groups = [
  {
    id: 1,
    name: 'Family Savings',
    amount: 50000,
    freq: 'Monthly',
    cycle: 3,
    members: 8,
    received: 5,
    status: 'active',
  },
  {
    id: 2,
    name: 'Market Women Ajo',
    amount: 20000,
    freq: 'Weekly',
    cycle: 6,
    members: 12,
    received: 10,
    status: 'active',
  },
  {
    id: 3,
    name: 'Church Group',
    amount: 10000,
    freq: 'Weekly',
    cycle: 1,
    members: 6,
    received: 2,
    status: 'active',
  },
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

    <div class="bg-accent-50 border border-accent-200 rounded-xl p-4 mb-6 flex items-center gap-3">
      <svg
        class="w-5 h-5 text-accent-600 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-sm text-accent-800">
        This data is placeholder. Real group data will appear once Firebase is connected.
      </p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <AppCard>
        <p class="text-sm text-muted mb-1">{{ stats[0].label }}</p>
        <p class="text-2xl font-bold text-slate-900">{{ stats[0].value }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted mb-1">{{ stats[1].label }}</p>
        <p class="text-2xl font-bold text-slate-900">{{ stats[1].value }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted mb-1">{{ stats[2].label }}</p>
        <p class="text-2xl font-bold text-slate-900">{{ stats[2].value }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted mb-1">{{ stats[3].label }}</p>
        <p class="text-2xl font-bold text-slate-900">{{ stats[3].value }}</p>
      </AppCard>
    </div>

    <h2 class="text-lg font-semibold text-slate-900 mb-4">Your Groups</h2>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="g in groups"
        :key="g.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
        @click="router.push({ name: 'GroupDetail', params: { id: g.id } })"
      >
        <div class="flex items-start justify-between mb-3">
          <h3 class="font-semibold text-slate-900">{{ g.name }}</h3>
          <span class="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">{{
            g.freq
          }}</span>
        </div>
        <div class="space-y-1.5 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Contribution</span>
            <span class="font-medium">₦{{ g.amount.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Cycle</span>
            <span class="font-medium">{{ g.cycle }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Members</span>
            <span class="font-medium">{{ g.members }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Progress</span>
            <span class="font-medium">{{ g.received }} / {{ g.members }} received</span>
          </div>
        </div>
        <div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 rounded-full"
            :style="{ width: (g.received / g.members) * 100 + '%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
