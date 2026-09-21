<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'
import { Wallet } from '@lucide/vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppStat from '@/components/common/AppStat.vue'
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
    <h1 class="text-2xl font-bold text-fg mb-6">My Contributions</h1>

    <div v-if="contributionsStore.myContributionsLoading" aria-label="Loading..." aria-busy="true">
      <div class="bg-card rounded-xl border border-line shadow-sm p-5 mb-6">
        <AppSkeleton class="h-3 w-28 mb-2" />
        <AppSkeleton class="h-7 w-20" />
      </div>
      <div class="bg-card rounded-xl border border-line shadow-sm overflow-hidden">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-3 border-b border-line-subtle">
          <AppSkeleton class="h-3.5 w-28" />
          <AppSkeleton class="h-3.5 w-16" />
          <AppSkeleton class="h-3.5 w-20" />
          <AppSkeleton class="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>

    <template v-else>
      <AppAlert
        v-if="contributionsStore.myContributionsError"
        variant="danger"
        title="Couldn't load your contributions"
        action-label="Try again"
        class="mb-6"
        @action="contributionsStore.fetchMyContributions()"
      >
        {{ contributionsStore.myContributionsError }}
      </AppAlert>

      <AppStat
        label="Total Contributed"
        :value="formatNaira(contributionsStore.myTotalContributed)"
        :icon="Wallet"
        variant="success"
        class="mb-6"
      />

      <div v-if="contributionsStore.myContributions.length" class="bg-card rounded-xl border border-line shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-line-subtle bg-line-subtle text-left">
              <th class="px-5 py-3 font-medium text-muted">Group</th>
              <th class="px-5 py-3 font-medium text-muted">Cycle</th>
              <th class="px-5 py-3 font-medium text-muted">Amount</th>
              <th class="px-5 py-3 font-medium text-muted hidden sm:table-cell">Date Paid</th>
              <th class="px-5 py-3 font-medium text-muted">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line-subtle">
            <tr v-for="c in contributionsStore.myContributions" :key="c.id" class="hover:bg-line-subtle cursor-pointer" @click="router.push({ name: 'GroupDetail', params: { id: c.groupId } })">
              <td class="px-5 py-3 font-medium">
                <RouterLink
                  :to="{ name: 'GroupDetail', params: { id: c.groupId } }"
                  class="text-fg hover:text-primary-700"
                  @click.stop
                >
                  {{ c.groupName }}
                </RouterLink>
              </td>
              <td class="px-5 py-3 text-fg-2">Cycle {{ c.cycle }}</td>
              <td class="px-5 py-3 tabular-nums text-fg-2">{{ formatNaira(c.amount) }}</td>
              <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ formatDate(c.paidAt) }}</td>
              <td class="px-5 py-3">
                <AppStatusBadge v-if="c.status === 'void'" status="void" label="Voided" />
                <AppStatusBadge v-else status="paid" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="bg-card rounded-xl border border-line shadow-sm">
        <AppEmpty
          title="No contributions yet"
          description="Once your group starts a cycle and the admin marks your payments, they'll show up here."
        />
      </div>
    </template>
  </div>
</template>
