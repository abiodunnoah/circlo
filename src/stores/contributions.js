import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { db, auth } from '@/firebase'
import { collection, doc, query, where, getDoc, getDocs, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'

function toTime(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return Number(value) || 0
}

function contributionDocId(groupId, userId, cycle) {
  return `${cycle}_${userId}`
}

export const useContributionsStore = defineStore('contributions', () => {
  const contributions = ref([])
  const contributionsByMember = ref({})
  const contributionsLoading = ref(false)
  const contributionsError = ref(null)

  const myContributions = ref([])
  const myContributionsLoading = ref(false)
  const myContributionsError = ref(null)

  const myTotalContributed = computed(() =>
    myContributions.value
      .filter((c) => c.status !== 'void')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0),
  )

  function resetContributions() {
    contributions.value = []
    contributionsByMember.value = {}
    contributionsLoading.value = false
    contributionsError.value = null
  }

  function subscribeToCycleContributions(groupId, cycle) {
    resetContributions()
    contributionsLoading.value = true

    const unsubscribe = onSnapshot(
      query(collection(db, 'groups', groupId, 'contributions'), where('cycle', '==', cycle)),
      (snapshot) => {
        const byMember = {}
        const list = []
        snapshot.docs.forEach((d) => {
          const data = d.data()
          const row = { id: d.id, ...data, memberId: data.userId }
          list.push(row)
          byMember[row.memberId] = row
        })
        contributions.value = list
        contributionsByMember.value = byMember
        contributionsLoading.value = false
      },
      (err) => {
        contributionsError.value = err.message
        contributionsLoading.value = false
      },
    )

    return unsubscribe
  }

  async function markAsPaid(groupId, userId, cycle) {
    const adminId = auth.currentUser?.uid
    if (!adminId) throw new Error('You must be signed in to do this')

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== adminId) throw new Error('Only the group admin can mark contributions as paid')

    const memberRef = doc(db, 'groups', groupId, 'members', userId)
    const memberDoc = await getDoc(memberRef)
    if (!memberDoc.exists() || memberDoc.data().status !== 'approved') {
      throw new Error('This member is not an approved member of the group')
    }

    const amount = Number(groupData.contributionAmount || 0)
    const docId = contributionDocId(groupId, userId, cycle)

    await setDoc(doc(db, 'groups', groupId, 'contributions', docId), {
      userId,
      cycle,
      amount,
      paidAt: serverTimestamp(),
      markedBy: adminId,
      status: 'paid',
    })

    return { id: docId, userId, cycle, amount, markedBy: adminId, status: 'paid' }
  }

  async function confirmPayout(groupId, memberId, cycle) {
    const adminId = auth.currentUser?.uid
    if (!adminId) throw new Error('You must be signed in to do this')

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== adminId) throw new Error('Only the group admin can confirm payouts')

    if (Number(groupData.currentCycle || 0) !== cycle) {
      throw new Error('Payout can only be confirmed for the current cycle')
    }
    if (groupData.currentCycleRecipientId && groupData.currentCycleRecipientId !== memberId) {
      throw new Error('Only the current cycle recipient can be confirmed as paid out')
    }

    const memberRef = doc(db, 'groups', groupId, 'members', memberId)
    const memberDoc = await getDoc(memberRef)
    if (!memberDoc.exists()) throw new Error('Member not found')

    await updateDoc(memberRef, { hasReceived: true })
  }

  async function voidContribution(groupId, userId, cycle) {
    const adminId = auth.currentUser?.uid
    if (!adminId) throw new Error('You must be signed in to do this')

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== adminId) throw new Error('Only the group admin can void contributions')

    const docId = contributionDocId(groupId, userId, cycle)

    await setDoc(doc(db, 'groups', groupId, 'contributions', docId), {
      userId,
      cycle,
      status: 'void',
      voidedBy: adminId,
      voidedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function fetchMyContributions() {
    const uid = auth.currentUser?.uid
    if (!uid) {
      myContributions.value = []
      return
    }
    myContributionsLoading.value = true
    myContributionsError.value = null

    const groupIds = new Set()
    try {
      const adminSnapshot = await getDocs(query(collection(db, 'groups'), where('adminId', '==', uid)))
      adminSnapshot.docs.forEach((d) => groupIds.add(d.id))
    } catch (e) {
      console.error('Failed to list admin groups for contributions', e)
      myContributionsError.value = e.message
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      const memberGroupIds = userDoc.exists() ? userDoc.data().memberGroupIds || [] : []
      memberGroupIds.forEach((id) => groupIds.add(id))
    } catch (e) {
      console.error('Failed to list member groups for contributions', e)
      myContributionsError.value = e.message
    }

    const rows = []
    for (const groupId of groupIds) {
      try {
        const [groupDoc, snapshot] = await Promise.all([
          getDoc(doc(db, 'groups', groupId)),
          getDocs(collection(db, 'groups', groupId, 'contributions')),
        ])
        const groupName = groupDoc.exists() ? groupDoc.data().name || groupId : groupId
        const memberNameByUid = {}
        try {
          const memberSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
          memberSnapshot.docs.forEach((d) => {
            const data = d.data()
            if (data.userId) memberNameByUid[data.userId] = data.displayName || data.userId
          })
        } catch (e) {
          console.error(`Failed to list members for ${groupId}`, e)
        }
        snapshot.docs.forEach((d) => {
          const data = d.data()
          if (data.userId !== uid) return
          rows.push({
            id: d.id,
            groupId,
            groupName,
            memberName: memberNameByUid[uid] || uid,
            ...data,
            paidAtTime: toTime(data.paidAt),
          })
        })
      } catch (e) {
        console.error(`Failed to load contributions for ${groupId}`, e)
        myContributionsError.value = e.message
      }
    }

    rows.sort((a, b) => b.paidAtTime - a.paidAtTime || a.groupName.localeCompare(b.groupName))
    myContributions.value = rows
    myContributionsLoading.value = false
  }

  return {
    contributions,
    contributionsByMember,
    contributionsLoading,
    contributionsError,
    myContributions,
    myContributionsLoading,
    myContributionsError,
    myTotalContributed,
    resetContributions,
    subscribeToCycleContributions,
    markAsPaid,
    confirmPayout,
    voidContribution,
    fetchMyContributions,
  }
})
