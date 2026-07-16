<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const tab = ref('member')

const memberGroups = [
  { id: 1, name: 'Family Savings', amount: 50000, freq: 'Monthly', cycle: 3, admin: 'Chidi N.', memberCount: 8 },
  { id: 2, name: 'Neighborhood Ajo', amount: 15000, freq: 'Weekly', cycle: 5, admin: 'Fatima B.', memberCount: 10 },
]

const adminGroups = [
  { id: 3, name: 'Market Women Ajo', amount: 20000, freq: 'Weekly', cycle: 6, admin: 'You', memberCount: 12 },
  { id: 4, name: 'Church Group', amount: 10000, freq: 'Weekly', cycle: 1, admin: 'You', memberCount: 6 },
]
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

    <div v-if="tab === 'member'" class="space-y-3">
      <div v-for="g in memberGroups" :key="g.id" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" @click="router.push({ name: 'GroupDetail', params: { id: g.id } })">
        <div>
          <h3 class="font-semibold text-slate-900">{{ g.name }}</h3>
          <p class="text-sm text-muted">Admin: {{ g.admin }} &middot; {{ g.freq }} &middot; {{ g.memberCount }} members</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium">Cycle {{ g.cycle }}</p>
          <p class="text-sm text-muted">₦{{ g.amount.toLocaleString() }}/ea</p>
        </div>
      </div>
    </div>

    <div v-if="tab === 'admin'" class="space-y-3">
      <div v-for="g in adminGroups" :key="g.id" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" @click="router.push({ name: 'GroupDetail', params: { id: g.id } })">
        <div>
          <h3 class="font-semibold text-slate-900">{{ g.name }}</h3>
          <p class="text-sm text-muted">{{ g.freq }} &middot; {{ g.memberCount }} members</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium">Cycle {{ g.cycle }}</p>
          <p class="text-sm text-muted">₦{{ g.amount.toLocaleString() }}/ea</p>
        </div>
      </div>
    </div>
  </div>
</template>
