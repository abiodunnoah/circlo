<script setup>
import { ref } from 'vue'

const selectedGroup = ref(1)
const selectedCycle = ref('all')

const groups = [
  { id: 1, name: 'Market Women Ajo' },
  { id: 2, name: 'Family Savings' },
]

const summary = {
  totalContributions: 120000,
  membersPaid: 4,
  totalMembers: 6,
  cycleRange: '1 - 6',
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Reports</h1>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div class="grid sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Group</label>
          <select v-model="selectedGroup" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Cycle</label>
          <select v-model="selectedCycle" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="all">All Cycles</option>
            <option v-for="c in 6" :key="c" :value="c">Cycle {{ c }}</option>
          </select>
        </div>
        <div class="flex items-end">
          <button class="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 cursor-pointer flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>
    </div>

    <div class="grid sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p class="text-sm text-muted mb-1">Total Contributed</p>
        <p class="text-2xl font-bold text-slate-900">₦{{ summary.totalContributions.toLocaleString() }}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p class="text-sm text-muted mb-1">Members Paid (Cycle {{ selectedCycle === 'all' ? '6' : selectedCycle }})</p>
        <p class="text-2xl font-bold text-slate-900">{{ summary.membersPaid }} / {{ summary.totalMembers }}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p class="text-sm text-muted mb-1">Cycles Covered</p>
        <p class="text-2xl font-bold text-slate-900">{{ summary.cycleRange }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th class="text-left px-5 py-3 font-medium text-muted">Cycle</th>
            <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Total Collected</th>
            <th class="text-left px-5 py-3 font-medium text-muted">Recipient</th>
            <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Contributions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr class="hover:bg-slate-50">
            <td class="px-5 py-3 font-medium text-slate-900">1</td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">₦120,000</td>
            <td class="px-5 py-3">Chidi Nwosu</td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">6/6</td>
          </tr>
          <tr class="hover:bg-slate-50">
            <td class="px-5 py-3 font-medium text-slate-900">2</td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">₦120,000</td>
            <td class="px-5 py-3">Amara Okafor</td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">6/6</td>
          </tr>
          <tr class="hover:bg-slate-50">
            <td class="px-5 py-3 font-medium text-slate-900">3</td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">₦120,000</td>
            <td class="px-5 py-3">Tunde Balogun</td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">6/6</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
