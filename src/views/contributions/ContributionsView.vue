<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'
import AppLoader from '@/components/common/AppLoader.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import { formatNaira } from '@/utils/format'

const router = useRouter()
const contributionsStore = useContributionsStore()

function formatDate(value) {
  if (!value) return '—'
  const time = typeof value.toMillis === 'function' ? value.toMillis() : value
  return new Date(time).toLocaleDateString()
}

onMounted(() => {
  contributionsStore.fetchMyContributions()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">My Contributions</h1>

    <div v-if="contributionsStore.myContributionsLoading" class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <AppLoader text="Loading your contributions..." />
    </div>

    <template v-else>
      <div v-if="contributionsStore.myContributionsError" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p class="text-sm font-medium text-red-800 mb-1">Couldn't load your contributions</p>
        <p class="text-sm text-red-700 mb-2">{{ contributionsStore.myContributionsError }}</p>
        <button class="text-sm font-medium text-red-700 underline cursor-pointer" @click="contributionsStore.fetchMyContributions()">Try again</button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <p class="text-sm text-muted mb-1">Total Contributed</p>
        <p class="text-2xl font-bold text-slate-900">{{ formatNaira(contributionsStore.myTotalContributed) }}</p>
      </div>

      <div v-if="contributionsStore.myContributions.length" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50 text-left">
              <th class="px-5 py-3 font-medium text-muted">Group</th>
              <th class="px-5 py-3 font-medium text-muted">Cycle</th>
              <th class="px-5 py-3 font-medium text-muted">Amount</th>
              <th class="px-5 py-3 font-medium text-muted hidden sm:table-cell">Date Paid</th>
              <th class="px-5 py-3 font-medium text-muted">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="c in contributionsStore.myContributions" :key="c.id" class="hover:bg-slate-50 cursor-pointer" @click="router.push({ name: 'GroupDetail', params: { id: c.groupId } })">
              <td class="px-5 py-3 font-medium text-slate-900">{{ c.groupName }}</td>
              <td class="px-5 py-3 text-slate-700">Cycle {{ c.cycle }}</td>
              <td class="px-5 py-3 text-slate-700">{{ formatNaira(c.amount) }}</td>
              <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ formatDate(c.paidAt) }}</td>
              <td class="px-5 py-3">
                <AppBadge v-if="c.status === 'void'" variant="void">Voided</AppBadge>
                <AppBadge v-else variant="paid">Paid</AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <AppEmpty
          title="No contributions yet"
          description="Once your group starts a cycle and the admin marks your payments, they'll show up here."
        />
      </div>
    </template>
  </div>
</template>
