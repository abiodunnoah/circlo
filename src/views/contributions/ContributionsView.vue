<script setup>
import { ref } from 'vue'
import AppBadge from '@/components/common/AppBadge.vue'

const cycles = [1, 2, 3, 4, 5]
const selectedCycle = ref(6)

const contributions = [
  { name: 'Chidi Nwosu', paid: true, date: '2025-06-15', amount: 20000 },
  { name: 'Amara Okafor', paid: true, date: '2025-06-14', amount: 20000 },
  { name: 'Tunde Balogun', paid: true, date: '2025-06-16', amount: 20000 },
  { name: 'Fatima Bello', paid: false, date: null, amount: 20000 },
  { name: 'Emeka Obi', paid: false, date: null, amount: 20000 },
  { name: 'Ngozi Eze', paid: false, date: null, amount: 20000 },
]

const paidCount = contributions.filter((c) => c.paid).length
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Contributions</h1>

      <div class="flex items-center gap-2">
        <label class="text-sm text-muted">Cycle:</label>
        <select v-model="selectedCycle" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option v-for="c in cycles" :key="c" :value="c">Cycle {{ c }}</option>
          <option value="6">Cycle 6 (current)</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <p class="text-sm font-medium text-slate-700">Cycle {{ selectedCycle }}</p>
        <p class="text-sm text-muted">{{ paidCount }} of {{ contributions.length }} paid</p>
      </div>

      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100">
            <th class="text-left px-5 py-3 font-medium text-muted">Member</th>
            <th class="text-left px-5 py-3 font-medium text-muted">Status</th>
            <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Date Paid</th>
            <th class="text-right px-5 py-3 font-medium text-muted">Amount</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="c in contributions" :key="c.name" class="hover:bg-slate-50">
            <td class="px-5 py-3 font-medium text-slate-900">{{ c.name }}</td>
            <td class="px-5 py-3">
              <AppBadge v-if="c.paid" variant="paid">Paid</AppBadge>
              <AppBadge v-else variant="pending">Unpaid</AppBadge>
            </td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ c.date || '—' }}</td>
            <td class="px-5 py-3 text-right font-medium">₦{{ c.amount.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-6 text-center">
      <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer">Mark Selected as Paid</button>
    </div>
  </div>
</template>
