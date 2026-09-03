import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db, auth } from '@/firebase'
import { collection, getDoc, getDocs, doc } from 'firebase/firestore'

export function buildCycleRows(cycles, contributions, members, currentCycle = 0) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const cycleDocMap = new Map(cycles.map((c) => [Number(c.cycle), c]))

  const cycleNumbers = new Set(cycles.map((c) => Number(c.cycle)))
  contributions.forEach((c) => cycleNumbers.add(Number(c.cycle)))
  if (currentCycle > 0) cycleNumbers.add(currentCycle)

  return Array.from(cycleNumbers)
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((cycle) => {
      const cycleDoc = cycleDocMap.get(cycle) || null
      const cycleContributions = contributions.filter((c) => Number(c.cycle) === cycle)
      const paid = cycleContributions.filter((c) => c.status === 'paid')
      const expected = members.filter(
        (m) =>
          m.status === 'approved' &&
          !m.leftAt &&
          (m.joinedCycle ?? 1) <= cycle,
      )
      const recipient = cycleDoc?.recipientId
        ? byId.get(cycleDoc.recipientId)
        : null
      return {
        cycle,
        totalCollected: paid.reduce((sum, c) => sum + Number(c.amount || 0), 0),
        recipientName: cycleDoc?.recipientName || (recipient ? recipient.displayName : null) || '—',
        startedAt: cycleDoc?.startedAt || null,
        receivedAt: cycleDoc?.receivedAt || null,
        paidCount: paid.length,
        totalCount: expected.length,
        allPaid: expected.length > 0 && paid.length >= expected.length,
      }
    })
    .sort((a, b) => a.cycle - b.cycle)
}

export const useReportsStore = defineStore('reports', () => {
  const group = ref(null)
  const members = ref([])
  const contributions = ref([])
  const cycles = ref([])
  const rows = ref([])
  const loading = ref(false)
  const error = ref(null)

  function resetReport() {
    group.value = null
    members.value = []
    contributions.value = []
    cycles.value = []
    rows.value = []
    loading.value = false
    error.value = null
  }

  async function loadReport(groupId) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to view reports')
    loading.value = true
    error.value = null
    try {
      const [groupDoc, membersSnap, contribSnap, cyclesSnap] = await Promise.all([
        getDoc(doc(db, 'groups', groupId)),
        getDocs(collection(db, 'groups', groupId, 'members')),
        getDocs(collection(db, 'groups', groupId, 'contributions')),
        getDocs(collection(db, 'groups', groupId, 'cycles')),
      ])
      if (!groupDoc.exists()) throw new Error('Group not found')

      group.value = { id: groupDoc.id, ...groupDoc.data() }
      members.value = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      contributions.value = contribSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      cycles.value = cyclesSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.cycle) - Number(b.cycle))
      rows.value = buildCycleRows(cycles.value, contributions.value, members.value, group.value?.currentCycle || 0)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    group,
    members,
    contributions,
    cycles,
    rows,
    loading,
    error,
    resetReport,
    loadReport,
  }
})