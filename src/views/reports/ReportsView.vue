<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { useReportsStore } from '@/stores/reports'
import { useToast } from '@/composables/useToast'
import { Download, Wallet, Users, CalendarClock } from '@lucide/vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppBackButton from '@/components/common/AppBackButton.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppStat from '@/components/common/AppStat.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import TableWrap from '@/components/common/TableWrap.vue'
import { formatNaira } from '@/utils/format'
import Chart from 'chart.js/auto'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const router = useRouter()
const groupsStore = useGroupsStore()
const reportsStore = useReportsStore()
const toast = useToast()

const selectedGroupId = ref('')
const selectedCycle = ref('all')

const adminGroups = computed(() => groupsStore.groups.filter((g) => g.role === 'admin'))

const barCanvas = ref(null)
const donutCanvas = ref(null)
let barChart = null
let donutChart = null

const filteredRows = computed(() => {
  const rows = reportsStore.rows
  if (selectedCycle.value === 'all') return rows
  return rows.filter((r) => String(r.cycle) === String(selectedCycle.value))
})

const totalContributed = computed(() =>
  reportsStore.rows.reduce((sum, r) => sum + r.totalCollected, 0),
)

const currentCycle = computed(() => reportsStore.group?.currentCycle || 0)

const currentRow = computed(() =>
  reportsStore.rows.find((r) => r.cycle === currentCycle.value),
)

const cycleRange = computed(() => {
  if (!reportsStore.rows.length) return '—'
  const first = reportsStore.rows[0].cycle
  const last = reportsStore.rows[reportsStore.rows.length - 1].cycle
  return first === last ? `${first}` : `${first} - ${last}`
})

function destroyCharts() {
  if (barChart) {
    barChart.destroy()
    barChart = null
  }
  if (donutChart) {
    donutChart.destroy()
    donutChart = null
  }
}

function renderCharts() {
  destroyCharts()
  if (barCanvas.value && reportsStore.rows.length) {
    barChart = new Chart(barCanvas.value, {
      type: 'bar',
      data: {
        labels: reportsStore.rows.map((r) => `C${r.cycle}`),
        datasets: [
          {
            label: 'Collected',
            data: reportsStore.rows.map((r) => r.totalCollected),
            backgroundColor: 'rgba(5, 150, 105, 0.75)',
            borderRadius: 4,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    })
  }
  if (donutCanvas.value && currentRow.value && currentCycle.value > 0) {
    const unpaid = Math.max(0, currentRow.value.totalCount - currentRow.value.paidCount)
    donutChart = new Chart(donutCanvas.value, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Unpaid'],
        datasets: [
          {
            data: [currentRow.value.paidCount, unpaid],
            backgroundColor: ['rgba(5, 150, 105, 0.8)', 'rgba(245, 158, 11, 0.8)'],
          },
        ],
      },
      options: { plugins: { legend: { position: 'bottom' } } },
    })
  }
}

async function selectGroup() {
  if (!selectedGroupId.value) return
  try {
    await reportsStore.loadReport(selectedGroupId.value)
    selectedCycle.value = 'all'
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

function exportPdf() {
  const g = reportsStore.group
  if (!g) return
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(g.name || 'Group Report', 14, 20)
  doc.setFontSize(10)
  doc.text(`Contribution: ${formatNaira(g.contributionAmount)} / ${g.frequency || ''}`, 14, 28)
  doc.text(`Cycles: ${cycleRange.value}    Rotation: ${g.rotation || 1}`, 14, 34)
  autoTable(doc, {
    startY: 42,
    head: [['Cycle', 'Total Collected', 'Recipient', 'Paid', 'Status']],
    body: reportsStore.rows.map((r) => [
      `Cycle ${r.cycle}`,
      formatNaira(r.totalCollected),
      r.recipientName,
      `${r.paidCount}/${r.totalCount}`,
      r.allPaid ? 'Complete' : 'Incomplete',
    ]),
  })
  doc.save(`${(g.name || 'group').replace(/\s+/g, '-').toLowerCase()}-report.pdf`)
}

watch(selectedGroupId, () => selectGroup())

watch(
  [() => reportsStore.rows, currentCycle, selectedCycle],
  async () => {
    await nextTick()
    renderCharts()
  },
  { deep: true },
)

watch(adminGroups, (groups) => {
  if (groups.length && !selectedGroupId.value) {
    selectedGroupId.value = groups[0].id
  }
}, { immediate: true })

onMounted(() => {})

onUnmounted(() => {
  destroyCharts()
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <AppBackButton :fallback="{ name: 'Dashboard' }" />
    <h1 class="text-2xl font-bold text-fg mb-6">Reports</h1>

    <AppCard v-if="adminGroups.length === 0" padding="p-0">
      <AppEmpty
        title="No groups to report on"
        description="Reports are available for groups you administer. Create a group to get started."
        action-label="Create a group"
        @action="router.push({ name: 'CreateGroup' })"
      />
    </AppCard>

    <template v-else>
      <AppCard class="mb-6">
        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-fg-2 mb-1">Group</label>
            <select v-model="selectedGroupId" class="block w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="g in adminGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-fg-2 mb-1">Cycle</label>
            <select v-model="selectedCycle" class="block w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">All Cycles</option>
              <option v-for="c in reportsStore.rows" :key="c.cycle" :value="String(c.cycle)">Cycle {{ c.cycle }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <AppButton
              variant="primary"
              block
              :disabled="!reportsStore.rows.length"
              @click="exportPdf"
            >
              <Download class="w-4 h-4" />
              Export PDF
            </AppButton>
          </div>
        </div>
      </AppCard>

      <div v-if="reportsStore.loading" aria-label="Loading..." aria-busy="true">
        <div class="grid sm:grid-cols-3 gap-4 mb-6">
          <AppCard v-for="i in 3" :key="i" padding="p-4">
            <AppSkeleton class="h-3 w-28 mb-2" />
            <AppSkeleton class="h-7 w-20" />
          </AppCard>
        </div>
        <div class="grid lg:grid-cols-3 gap-4 mb-6">
          <AppCard padding="p-4" class="lg:col-span-2">
            <AppSkeleton class="h-4 w-32 mb-3" />
            <AppSkeleton class="h-64 w-full rounded-lg" />
          </AppCard>
          <AppCard padding="p-4">
            <AppSkeleton class="h-4 w-40 mb-3" />
            <AppSkeleton class="h-64 w-full rounded-lg" />
          </AppCard>
        </div>
        <AppCard padding="p-0" class="overflow-hidden">
          <div class="px-5 py-3 bg-line-subtle border-b border-line">
            <AppSkeleton class="h-4 w-32" />
          </div>
          <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-5 py-3 border-b border-line-subtle">
            <AppSkeleton class="h-3.5 w-16" />
            <AppSkeleton class="h-3.5 w-20" />
            <AppSkeleton class="h-3.5 w-24" />
            <AppSkeleton class="h-3.5 w-20" />
            <AppSkeleton class="h-5 w-16 rounded-full" />
          </div>
        </AppCard>
      </div>

      <AppAlert v-else-if="reportsStore.error" variant="danger" title="Couldn't load reports">
        {{ reportsStore.error }}
      </AppAlert>

      <template v-else>
        <div class="grid sm:grid-cols-3 gap-4 mb-6">
          <AppStat
            label="Total Contributed"
            :value="formatNaira(totalContributed)"
            :icon="Wallet"
            variant="success"
          />
          <AppStat
            :label="`Members Paid (Cycle ${currentCycle})`"
            :value="`${currentRow ? currentRow.paidCount : 0} / ${currentRow ? currentRow.totalCount : 0}`"
            :icon="Users"
            variant="info"
          />
          <AppStat label="Cycles Covered" :value="cycleRange" :icon="CalendarClock" variant="accent" />
        </div>

        <div class="grid lg:grid-cols-3 gap-4 mb-6">
          <AppCard padding="p-4" class="lg:col-span-2">
            <p class="text-sm font-medium text-fg-2 mb-3">Collected per Cycle</p>
            <div class="h-64">
              <canvas ref="barCanvas" />
            </div>
          </AppCard>
          <AppCard padding="p-4">
            <p class="text-sm font-medium text-fg-2 mb-3">Cycle {{ currentCycle }} Payment Status</p>
            <div class="h-64 flex items-center justify-center">
              <canvas ref="donutCanvas" />
            </div>
          </AppCard>
        </div>

        <AppCard padding="p-0" class="overflow-hidden">
          <TableWrap>
              <thead>
                <tr class="border-b border-line bg-line-subtle">
                  <th class="text-left px-5 py-3 font-medium text-muted">Cycle</th>
                  <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Started</th>
                  <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Total Collected</th>
                  <th class="text-left px-5 py-3 font-medium text-muted">Recipient</th>
                  <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Contributions</th>
                  <th class="text-left px-5 py-3 font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line-subtle">
                <tr v-for="r in filteredRows" :key="r.cycle" class="hover:bg-line-subtle">
                  <td class="px-5 py-3 font-medium text-fg">Cycle {{ r.cycle }}</td>
                  <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ r.startedAt ? new Date(r.startedAt.toMillis ? r.startedAt.toMillis() : r.startedAt).toLocaleDateString() : '—' }}</td>
                  <td class="px-5 py-3 text-muted hidden sm:table-cell tabular-nums">{{ formatNaira(r.totalCollected) }}</td>
                  <td class="px-5 py-3">{{ r.recipientName }}</td>
                  <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ r.paidCount }}/{{ r.totalCount }}</td>
                  <td class="px-5 py-3">
                    <AppStatusBadge
                      :status="r.allPaid ? 'received' : 'pending'"
                      :label="r.allPaid ? 'Complete' : 'Incomplete'"
                    />
                  </td>
                </tr>
              </tbody>
          </TableWrap>
          <div v-if="!filteredRows.length" class="px-5 py-10 text-center text-sm text-muted">
            No cycles recorded yet. Start the first cycle to begin collecting contributions.
          </div>
        </AppCard>
      </template>
    </template>
  </div>
</template>