<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { useReportsStore } from '@/stores/reports'
import { useToast } from '@/composables/useToast'
import AppLoader from '@/components/common/AppLoader.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
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

onMounted(async () => {
  await groupsStore.fetchUserGroups()
  if (adminGroups.value.length) {
    selectedGroupId.value = adminGroups.value[0].id
  }
})

onUnmounted(() => {
  destroyCharts()
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Reports</h1>

    <div v-if="adminGroups.length === 0" class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <AppEmpty
        title="No groups to report on"
        description="Reports are available for groups you administer. Create a group to get started."
        action-label="Create a group"
        @action="router.push({ name: 'CreateGroup' })"
      />
    </div>

    <template v-else>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Group</label>
            <select v-model="selectedGroupId" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="g in adminGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Cycle</label>
            <select v-model="selectedCycle" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">All Cycles</option>
              <option v-for="c in reportsStore.cycles" :key="c.cycle" :value="String(c.cycle)">Cycle {{ c.cycle }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              class="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              :disabled="!reportsStore.rows.length"
              @click="exportPdf"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div v-if="reportsStore.loading" class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <AppLoader text="Loading report..." />
      </div>

      <template v-else-if="reportsStore.error">
        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
          <p class="text-sm text-red-700">{{ reportsStore.error }}</p>
        </div>
      </template>

      <template v-else>
        <div class="grid sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p class="text-sm text-muted mb-1">Total Contributed</p>
            <p class="text-2xl font-bold text-slate-900">{{ formatNaira(totalContributed) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p class="text-sm text-muted mb-1">Members Paid (Cycle {{ currentCycle }})</p>
            <p class="text-2xl font-bold text-slate-900">{{ currentRow ? currentRow.paidCount : 0 }} / {{ currentRow ? currentRow.totalCount : 0 }}</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p class="text-sm text-muted mb-1">Cycles Covered</p>
            <p class="text-2xl font-bold text-slate-900">{{ cycleRange }}</p>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:col-span-2">
            <p class="text-sm font-medium text-slate-700 mb-3">Collected per Cycle</p>
            <div class="h-64">
              <canvas ref="barCanvas" />
            </div>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p class="text-sm font-medium text-slate-700 mb-3">Cycle {{ currentCycle }} Payment Status</p>
            <div class="h-64 flex items-center justify-center">
              <canvas ref="donutCanvas" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50">
                  <th class="text-left px-5 py-3 font-medium text-muted">Cycle</th>
                  <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Total Collected</th>
                  <th class="text-left px-5 py-3 font-medium text-muted">Recipient</th>
                  <th class="text-left px-5 py-3 font-medium text-muted hidden sm:table-cell">Contributions</th>
                  <th class="text-left px-5 py-3 font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="r in filteredRows" :key="r.cycle" class="hover:bg-slate-50">
                  <td class="px-5 py-3 font-medium text-slate-900">Cycle {{ r.cycle }}</td>
                  <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ formatNaira(r.totalCollected) }}</td>
                  <td class="px-5 py-3">{{ r.recipientName }}</td>
                  <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ r.paidCount }}/{{ r.totalCount }}</td>
                  <td class="px-5 py-3">
                    <span class="text-xs rounded-full px-2 py-0.5 font-medium" :class="r.allPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                      {{ r.allPaid ? 'Complete' : 'Incomplete' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!filteredRows.length" class="px-5 py-10 text-center text-sm text-muted">
            No cycles recorded yet. Start the first cycle to begin collecting contributions.
          </div>
        </div>
      </template>
    </template>
  </div>
</template>