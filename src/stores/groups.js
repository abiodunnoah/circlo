import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db, auth } from '@/firebase'
import { collection, doc, query, where, getDocs, getDoc, addDoc, updateDoc, setDoc, onSnapshot, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'

function generateInviteCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const random = new Uint8Array(8)
  crypto.getRandomValues(random)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[random[i] % chars.length]
  }
  return code
}

function toTime(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return Number(value) || 0
}

async function ensureMembership(uid, groupId) {
  await setDoc(doc(db, 'users', uid), { memberGroupIds: arrayUnion(groupId) }, { merge: true })
}

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref([])
  const loading = ref(false)
  const error = ref(null)

  const currentGroup = ref(null)
  const members = ref([])
  const pendingMembers = ref([])
  const approvedMembers = ref([])
  const currentGroupStatus = ref('idle')

  const pendingRequests = ref([])
  const requestsLoading = ref(false)
  const requestsError = ref(null)

  function resetCurrentGroup() {
    currentGroup.value = null
    members.value = []
    pendingMembers.value = []
    approvedMembers.value = []
    currentGroupStatus.value = 'idle'
    error.value = null
  }

  function resetAll() {
    resetCurrentGroup()
    groups.value = []
    pendingRequests.value = []
    requestsError.value = null
    requestsLoading.value = false
    loading.value = false
  }

  async function createGroup({ name, amount, frequency, startDate, adminId, adminName, adminEmail }) {
    loading.value = true
    error.value = null
    try {
      const parsedStartDate = new Date(startDate)
      if (isNaN(parsedStartDate.getTime())) {
        throw new Error('Please provide a valid start date')
      }
      const groupRef = await addDoc(collection(db, 'groups'), {
        name,
        contributionAmount: Number(amount),
        frequency,
        startDate: parsedStartDate,
        totalMembers: 1,
        currentCycle: 0,
        status: 'active',
        inviteCode: generateInviteCode(),
        adminId,
        createdAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'groups', groupRef.id, 'members', adminId), {
        userId: adminId,
        displayName: adminName,
        email: adminEmail,
        rotationOrder: 1,
        hasReceived: false,
        status: 'approved',
        joinedCycle: 1,
        joinedAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
      })

      await ensureMembership(adminId, groupRef.id)

      return groupRef.id
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchUserGroups() {
    loading.value = true
    error.value = null
    const uid = auth.currentUser?.uid
    if (!uid) {
      groups.value = []
      loading.value = false
      return
    }

    const adminGroups = []
    const memberOnlyGroups = []

    try {
      const adminQuery = query(collection(db, 'groups'), where('adminId', '==', uid))
      const adminSnapshot = await getDocs(adminQuery)
      adminGroups.push(
        ...adminSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          role: 'admin',
          membershipStatus: 'approved',
        })),
      )
    } catch (e) {
      console.error('Failed to load admin groups', e)
      error.value = e.message
    }

    const adminGroupIds = new Set(adminGroups.map((g) => g.id))

    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      const memberGroupIds = userDoc.exists() ? userDoc.data().memberGroupIds || [] : []
      for (const groupId of memberGroupIds) {
        if (adminGroupIds.has(groupId)) continue
        const [groupDoc, memberDoc] = await Promise.all([
          getDoc(doc(db, 'groups', groupId)),
          getDoc(doc(db, 'groups', groupId, 'members', uid)),
        ])
        if (!groupDoc.exists() || !memberDoc.exists()) continue
        const memberData = memberDoc.data()
        if (memberData.status === 'left') continue
        memberOnlyGroups.push({
          id: groupId,
          ...groupDoc.data(),
          role: 'member',
          membershipStatus: memberData.status,
        })
      }
    } catch (e) {
      console.error('Failed to load member groups', e)
      error.value = e.message
    }

    const allGroups = [...adminGroups, ...memberOnlyGroups]

    for (const g of allGroups) {
      const recipientId = g.currentCycleRecipientId
      if (!recipientId) continue
      try {
        const recipientDoc = await getDoc(doc(db, 'groups', g.id, 'members', recipientId))
        g.nextRecipientName = recipientDoc.exists() ? recipientDoc.data().displayName : null
      } catch (e) {
        console.error(`Failed to load next recipient for group ${g.id}`, e)
        g.nextRecipientName = null
      }
    }

    groups.value = allGroups
    loading.value = false
  }

  function subscribeToGroup(groupId) {
    resetCurrentGroup()
    currentGroupStatus.value = 'loading'

    const unsubscribeGroup = onSnapshot(
      doc(db, 'groups', groupId),
      (doc) => {
        if (!doc.exists()) {
          currentGroup.value = null
          currentGroupStatus.value = 'not_found'
          return
        }
        currentGroup.value = { id: doc.id, ...doc.data() }
        currentGroupStatus.value = 'ready'
      },
      (err) => {
        currentGroupStatus.value = 'error'
        error.value = err.message
      },
    )

    const unsubscribeMembers = onSnapshot(
      collection(db, 'groups', groupId, 'members'),
      (snapshot) => {
        const allMembers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        members.value = allMembers
        pendingMembers.value = allMembers
          .filter((m) => m.status === 'pending')
          .sort((a, b) => toTime(a.joinedAt) - toTime(b.joinedAt))
        approvedMembers.value = allMembers
          .filter((m) => m.status === 'approved' && !m.leftAt)
          .sort((a, b) => a.rotationOrder - b.rotationOrder)
      },
      (err) => {
        currentGroupStatus.value = 'error'
        error.value = err.message
      },
    )

    return () => {
      unsubscribeGroup()
      unsubscribeMembers()
      resetCurrentGroup()
    }
  }

  async function generateInviteLink(groupId) {
    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) return ''
    const inviteCode = groupDoc.data().inviteCode
    return `${window.location.origin}/join?invite=${inviteCode}`
  }

  async function getGroupByInviteCode(inviteCode) {
    const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  }

  async function joinGroupByInvite(inviteCode, userId, displayName, email) {
    const group = await getGroupByInviteCode(inviteCode)
    if (!group) throw new Error('Invalid invite link')
    if (group.adminId === userId) throw new Error('You are already the admin of this group')

    const memberRef = doc(db, 'groups', group.id, 'members', userId)
    const memberDoc = await getDoc(memberRef)
    if (memberDoc.exists()) {
      const existing = memberDoc.data()
      if (existing.status === 'approved') {
        await ensureMembership(userId, group.id)
        throw new Error('You are already a member of this group')
      }
      if (existing.status === 'pending') {
        await ensureMembership(userId, group.id)
        return { group, member: { id: memberRef.id, ...existing }, status: 'pending' }
      }
      if (existing.status === 'rejected') {
        throw new Error('Your previous request to join this group was declined. Please contact the admin.')
      }
      if (existing.status === 'left') {
        throw new Error('You have left this group. Please contact the admin if you want to rejoin.')
      }
    }

    if (group.currentCycleRecipientId) {
      throw new Error('This group is currently mid-rotation. New members can join once every member has received the pot this rotation.')
    }

    await setDoc(memberRef, {
      userId,
      displayName,
      email,
      rotationOrder: 0,
      hasReceived: false,
      status: 'pending',
      joinedAt: serverTimestamp(),
    })
    await ensureMembership(userId, group.id)

    const groupDoc = await getDoc(doc(db, 'groups', group.id))
    if (groupDoc.exists()) {
      const pendingCount = (groupDoc.data().pendingCount || 0) + 1
      await updateDoc(doc(db, 'groups', group.id), { pendingCount })
    }

    return { group, member: { id: memberRef.id }, status: 'pending' }
  }

  async function approveMember(groupId, memberId) {
    const memberRef = doc(db, 'groups', groupId, 'members', memberId)
    const memberDoc = await getDoc(memberRef)
    if (!memberDoc.exists()) return

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    const groupData = groupDoc.exists() ? groupDoc.data() : {}
    const currentCycle = groupData.currentCycle || 0

    const nextOrder = approvedMembers.value.length
      ? Math.max(...approvedMembers.value.map((m) => m.rotationOrder)) + 1
      : 1

    await updateDoc(memberRef, {
      status: 'approved',
      rotationOrder: nextOrder,
      joinedCycle: currentCycle + 1,
      approvedAt: serverTimestamp(),
    })

    const totalMembers = (groupData.totalMembers || 0) + 1
    const pendingCount = Math.max(0, (groupData.pendingCount || 0) - 1)
    await updateDoc(doc(db, 'groups', groupId), { totalMembers, pendingCount })
  }

  async function rejectMember(groupId, memberId) {
    await updateDoc(doc(db, 'groups', groupId, 'members', memberId), {
      status: 'rejected',
    })

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (groupDoc.exists()) {
      const pendingCount = Math.max(0, (groupDoc.data().pendingCount || 0) - 1)
      await updateDoc(doc(db, 'groups', groupId), { pendingCount })
    }
  }

  async function removeMember(groupId, memberId) {
    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) throw new Error('Group not found')

    const memberRef = doc(db, 'groups', groupId, 'members', memberId)
    const memberDoc = await getDoc(memberRef)
    if (!memberDoc.exists()) return
    if (memberDoc.data().userId === groupDoc.data().adminId) {
      throw new Error('The admin cannot be removed from the group')
    }

    await updateDoc(memberRef, {
      status: 'left',
      leftAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'users', memberId), { memberGroupIds: arrayRemove(groupId) })

    const totalMembers = Math.max(0, (groupDoc.data().totalMembers || 1) - 1)
    await updateDoc(doc(db, 'groups', groupId), { totalMembers })

    const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
    const remaining = membersSnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((m) => m.status === 'approved' && m.id !== memberId)
      .sort((a, b) => a.rotationOrder - b.rotationOrder)
    for (let i = 0; i < remaining.length; i++) {
      const expected = i + 1
      if (remaining[i].rotationOrder !== expected) {
        await updateDoc(doc(db, 'groups', groupId, 'members', remaining[i].id), {
          rotationOrder: expected,
        })
      }
    }
  }

  async function startNewCycle(groupId) {
    const groupRef = doc(db, 'groups', groupId)
    const groupDoc = await getDoc(groupRef)
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    const currentCycle = groupData.currentCycle || 0
    const recipientId = groupData.currentCycleRecipientId || null

    const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
    const allMembers = membersSnapshot.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
    const eligible = allMembers.filter(
      (m) => m.status === 'approved' && !m.leftAt && (m.joinedCycle ?? 1) <= Math.max(currentCycle, 1),
    )

    if (currentCycle >= 1 && recipientId) {
      const recipient = allMembers.find((m) => m.id === recipientId)
      if (!recipient || !recipient.hasReceived) {
        throw new Error(
          'The current cycle is still in progress. The designated recipient must be marked as paid before a new cycle can start.',
        )
      }
    }

    const newCycle = currentCycle + 1
    const rotationConcluded = eligible.length > 0 && eligible.every((m) => m.hasReceived)

    if (rotationConcluded) {
      for (const m of eligible) {
        await updateDoc(m.ref, { hasReceived: false, joinedCycle: newCycle })
        m.hasReceived = false
        m.joinedCycle = newCycle
      }
    }

    if (eligible.length === 0) {
      throw new Error('This group has no eligible members. Approve members before starting a cycle.')
    }

    const nextEligible = eligible
      .filter((m) => !m.hasReceived)
      .sort((a, b) => a.rotationOrder - b.rotationOrder)

    await updateDoc(groupRef, {
      currentCycle: newCycle,
      currentCycleStartDate: new Date(),
      rotation: (groupData.rotation || 1) + (rotationConcluded ? 1 : 0),
      currentCycleRecipientId: nextEligible[0]?.id || null,
    })
  }

  async function syncMemberDisplayName(uid, displayName) {
    const groupIds = new Set()

    try {
      const adminSnapshot = await getDocs(
        query(collection(db, 'groups'), where('adminId', '==', uid)),
      )
      adminSnapshot.docs.forEach((d) => groupIds.add(d.id))
    } catch (e) {
      console.error('Failed to list admin groups while syncing name', e)
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      const memberGroupIds = userDoc.exists() ? userDoc.data().memberGroupIds || [] : []
      memberGroupIds.forEach((id) => groupIds.add(id))
    } catch (e) {
      console.error('Failed to list member groups while syncing name', e)
    }

    for (const groupId of groupIds) {
      try {
        const memberRef = doc(db, 'groups', groupId, 'members', uid)
        const memberDoc = await getDoc(memberRef)
        if (memberDoc.exists()) {
          await updateDoc(memberRef, { displayName })
        }
      } catch (e) {
        console.error(`Failed to sync display name in group ${groupId}`, e)
      }
    }
  }

  async function fetchPendingRequests() {
    requestsLoading.value = true
    requestsError.value = null
    const uid = auth.currentUser?.uid
    if (!uid) {
      pendingRequests.value = []
      requestsLoading.value = false
      return
    }

    try {
      const adminSnapshot = await getDocs(
        query(collection(db, 'groups'), where('adminId', '==', uid)),
      )
      const results = []
      for (const groupDoc of adminSnapshot.docs) {
        const membersSnapshot = await getDocs(
          collection(db, 'groups', groupDoc.id, 'members'),
        )
        const pending = membersSnapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.status === 'pending')
          .sort((a, b) => toTime(a.joinedAt) - toTime(b.joinedAt))
        for (const member of pending) {
          results.push({
            groupId: groupDoc.id,
            groupName: groupDoc.data().name,
            member,
          })
        }
      }
      pendingRequests.value = results
    } catch (e) {
      console.error('Failed to load pending requests', e)
      requestsError.value = e.message
    } finally {
      requestsLoading.value = false
    }
  }

  return {
    groups,
    loading,
    error,
    currentGroup,
    members,
    pendingMembers,
    approvedMembers,
    currentGroupStatus,
    pendingRequests,
    requestsLoading,
    requestsError,
    resetCurrentGroup,
    resetAll,
    createGroup,
    fetchUserGroups,
    subscribeToGroup,
    generateInviteLink,
    getGroupByInviteCode,
    joinGroupByInvite,
    approveMember,
    rejectMember,
    removeMember,
    startNewCycle,
    syncMemberDisplayName,
    fetchPendingRequests,
  }
})
