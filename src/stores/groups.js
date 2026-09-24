import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db, auth } from '@/firebase'
import { collection, doc, query, where, getDocs, getDoc, addDoc, updateDoc, setDoc, deleteDoc, onSnapshot, arrayUnion, arrayRemove, serverTimestamp, deleteField } from 'firebase/firestore'
import { createNotification } from '@/stores/notifications'

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

const MAX_SLOTS = 10

function memberSlots(m) {
  return Math.max(1, Number(m?.slots) || 1)
}

function memberReceived(m) {
  if (m?.receivedCount !== undefined && m?.receivedCount !== null) return m.receivedCount
  return m?.hasReceived ? 1 : 0
}

function nextPosition(m, turnOrder) {
  const received = memberReceived(m)
  const id = m?.id || m?.userId
  if (Array.isArray(turnOrder) && turnOrder.length > 0 && id) {
    let seen = 0
    for (let i = 0; i < turnOrder.length; i++) {
      if (turnOrder[i] === id) {
        if (seen === received) return i
        seen++
      }
    }
    return Number.MAX_SAFE_INTEGER
  }
  return (m?.rotationOrder || 0) + received
}

function buildTurnOrder(members, groupData) {
  const existing = groupData?.turnOrder
  if (Array.isArray(existing) && existing.length > 0) {
    const approved = new Set(
      members.filter((m) => m.status === 'approved' && !m.leftAt).map((m) => m.id),
    )
    const valid = existing.every((id) => approved.has(id))
    if (valid && isValidTurnOrder(existing, members)) return existing
  }
  const approved = members
    .filter((m) => m.status === 'approved' && !m.leftAt)
    .sort((a, b) => (a.rotationOrder || 0) - (b.rotationOrder || 0))
  const order = []
  for (const m of approved) {
    const slots = memberSlots(m)
    for (let i = 0; i < slots; i++) order.push(m.id)
  }
  return order
}

function isValidTurnOrder(order, members) {
  const totalSlots = members
    .filter((m) => m.status === 'approved' && !m.leftAt)
    .reduce((sum, m) => sum + memberSlots(m), 0)
  if (order.length !== totalSlots) return false
  const slotCounts = {}
  for (const m of members) {
    if (m.status === 'approved' && !m.leftAt) slotCounts[m.id] = memberSlots(m)
  }
  const counts = {}
  for (const id of order) {
    counts[id] = (counts[id] || 0) + 1
    if (!slotCounts[id]) return false
  }
  return Object.keys(slotCounts).every((id) => counts[id] === slotCounts[id])
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

  let unsubUserDoc = null
  let unsubAdminGroups = null
  const memberListeners = ref({})
  let isSubscribed = false

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
    unsubscribeUserGroups()
    groups.value = []
    pendingRequests.value = []
    requestsError.value = null
    requestsLoading.value = false
    loading.value = false
  }

  function unsubscribeUserGroups() {
    if (unsubUserDoc) {
      unsubUserDoc()
      unsubUserDoc = null
    }
    if (unsubAdminGroups) {
      unsubAdminGroups()
      unsubAdminGroups = null
    }
    Object.values(memberListeners.value).forEach((fn) => fn())
    memberListeners.value = {}
    for (const key of Object.keys(adminGroupsMap)) delete adminGroupsMap[key]
    adminGroupIds = []
    memberGroupIds = []
    rebuildSeq += 1
    isSubscribed = false
  }

  const adminGroupsMap = {}
  let adminGroupIds = []
  let memberGroupIds = []
  let rebuildSeq = 0

  async function subscribeUserGroups() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    if (isSubscribed) return
    unsubscribeUserGroups()
    isSubscribed = true
    loading.value = true
    error.value = null

    unsubUserDoc = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        memberGroupIds = snap.exists() ? snap.data().memberGroupIds || [] : []
        syncMemberListeners(memberGroupIds)
        rebuildUserGroups()
      },
      (err) => {
        error.value = err.message
        loading.value = false
      },
    )

    unsubAdminGroups = onSnapshot(
      query(collection(db, 'groups'), where('adminId', '==', uid)),
      (snapshot) => {
        adminGroupIds = snapshot.docs.map((d) => d.id)
        for (const key of Object.keys(adminGroupsMap)) delete adminGroupsMap[key]
        snapshot.docs.forEach((d) => {
          adminGroupsMap[d.id] = d.data()
        })
        rebuildUserGroups()
      },
      (err) => {
        error.value = err.message
        loading.value = false
      },
    )
  }

  function syncMemberListeners(ids) {
    const current = memberListeners.value
    const currentIds = new Set(Object.keys(current))
    const newIds = new Set(ids)

    for (const gId of currentIds) {
      if (!newIds.has(gId)) {
        current[gId]()
        delete current[gId]
      }
    }

    for (const gId of ids) {
      if (!current[gId]) {
        current[gId] = onSnapshot(doc(db, 'groups', gId, 'members', auth.currentUser?.uid), () => {
          rebuildUserGroups()
        })
      }
    }
    memberListeners.value = { ...current }
  }

  async function enrichGroups(list) {
    await Promise.all(
      list.map(async (g) => {
        g.currentPot =
          Number(g.contributionAmount || 0) * (Number(g.totalSlots) || Number(g.totalMembers) || 0)
        g.paidCount = 0
        g.eligibleCount = Number(g.totalMembers || 0)
        g.memberSample = []

        try {
          const membersSnap = await getDocs(collection(db, 'groups', g.id, 'members'))
          const approved = membersSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((m) => m.status === 'approved' && !m.leftAt)
          g.memberSample = approved
            .slice(0, 6)
            .map((m) => ({ id: m.id, name: m.displayName || 'Member' }))

          const recipientId = g.currentCycleRecipientId
          if (recipientId) {
            g.nextRecipientName =
              approved.find((m) => m.id === recipientId)?.displayName || null
          }

          const cycle = Number(g.currentCycle || 0)
          if (cycle > 0) {
            const contribSnap = await getDocs(
              query(collection(db, 'groups', g.id, 'contributions'), where('cycle', '==', cycle)),
            )
            const paidIds = new Set(
              contribSnap.docs
                .filter((d) => d.data().status !== 'void')
                .map((d) => d.data().userId),
            )
            const eligible = approved.filter((m) => (m.joinedCycle ?? 1) <= cycle)
            g.eligibleCount = eligible.length
            g.paidCount = eligible.filter((m) => paidIds.has(m.id)).length
          } else {
            g.eligibleCount = approved.length
          }
        } catch {
          // keep defaults on failure
        }
      }),
    )
    return list
  }

  async function rebuildUserGroups() {
    const uid = auth.currentUser?.uid
    if (!uid || !isSubscribed) return
    const seq = ++rebuildSeq

    const allGroups = []
    const adminIdSet = new Set(adminGroupIds)

    for (const gId of adminGroupIds) {
      const gData = adminGroupsMap[gId] || {}
      allGroups.push({ id: gId, ...gData, role: 'admin', membershipStatus: 'approved' })
    }

    const memberOnlyIds = memberGroupIds.filter((gId) => !adminIdSet.has(gId))
    const memberGroupRows = await Promise.all(
      memberOnlyIds.map(async (gId) => {
        try {
          const memberSnap = await getDoc(doc(db, 'groups', gId, 'members', uid)).catch(() => null)
          if (!memberSnap || !memberSnap.exists()) return null
          const memberData = memberSnap.data()
          if (memberData.status === 'left' || memberData.status === 'rejected') {
            await updateDoc(doc(db, 'users', uid), { memberGroupIds: arrayRemove(gId) }).catch(() => {})
            return null
          }
          const groupSnap = await getDoc(doc(db, 'groups', gId))
          if (!groupSnap.exists()) return null
          return {
            id: gId,
            ...groupSnap.data(),
            role: 'member',
            membershipStatus: memberData.status,
          }
        } catch (e) {
          console.error('Failed to load member group', gId, e)
          return null
        }
      }),
    )
    for (const row of memberGroupRows) {
      if (row) allGroups.push(row)
    }

    await enrichGroups(allGroups)

    if (seq !== rebuildSeq) return
    groups.value = allGroups
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
      const inviteCode = generateInviteCode()
      const groupRef = await addDoc(collection(db, 'groups'), {
        name,
        contributionAmount: Number(amount),
        frequency,
        startDate: parsedStartDate,
        totalMembers: 1,
        totalSlots: 1,
        currentCycle: 0,
        currentCyclePayoutConfirmed: false,
        status: 'active',
        inviteCode,
        adminId,
        createdAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'invites', inviteCode), {
        groupId: groupRef.id,
        groupName: name,
        adminId,
      })

      await setDoc(doc(db, 'groups', groupRef.id, 'members', adminId), {
        userId: adminId,
        displayName: adminName,
        email: adminEmail,
        rotationOrder: 1,
        hasReceived: false,
        slots: 1,
        receivedCount: 0,
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
    await enrichGroups(allGroups)

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
        const allMembers = snapshot.docs.map((d) => {
          const data = d.data()
          const slots = memberSlots(data)
          const receivedCount = memberReceived(data)
          return { id: d.id, ...data, slots, receivedCount, hasReceived: receivedCount >= slots }
        })
        members.value = allMembers

        const groupData = currentGroup.value
        const turnOrder = groupData?.turnOrder

        for (const m of allMembers) {
          if (Array.isArray(turnOrder) && turnOrder.length > 0) {
            const positions = []
            for (let i = 0; i < turnOrder.length; i++) {
              if (turnOrder[i] === m.id) positions.push(i)
            }
            m.turnPositions = positions
          } else {
            m.turnPositions = []
            for (let i = 0; i < (m.slots || 1); i++) {
              m.turnPositions.push((m.rotationOrder || 0) - 1 + i)
            }
          }
        }

        pendingMembers.value = allMembers
          .filter((m) => m.status === 'pending')
          .sort((a, b) => toTime(a.joinedAt) - toTime(b.joinedAt))
        approvedMembers.value = allMembers
          .filter((m) => m.status === 'approved' && !m.leftAt)
          .sort((a, b) => {
            const aFirst = a.turnPositions?.[0] ?? (a.rotationOrder || 0) - 1
            const bFirst = b.turnPositions?.[0] ?? (b.rotationOrder || 0) - 1
            return aFirst - bFirst
          })
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
    const inviteSnap = await getDoc(doc(db, 'invites', inviteCode))
    if (!inviteSnap.exists()) return null
    const data = inviteSnap.data()
    return { id: data.groupId, name: data.groupName, adminId: data.adminId }
  }

  async function joinGroupByInvite(inviteCode, userId, displayName, email) {
    const invite = await getGroupByInviteCode(inviteCode)
    if (!invite) throw new Error('Invalid invite link')
    if (invite.adminId === userId) throw new Error('You are already the admin of this group')
    const groupId = invite.id

    let existing = null
    try {
      const memberSnap = await getDoc(doc(db, 'groups', groupId, 'members', userId))
      if (memberSnap.exists()) existing = memberSnap.data()
    } catch {
      /* permission denied → not yet a member; proceed */
    }

    if (existing) {
      if (existing.status === 'approved') {
        await ensureMembership(userId, groupId)
        throw new Error('You are already a member of this group')
      }
      if (existing.status === 'pending') {
        await ensureMembership(userId, groupId)
        return { group: { id: groupId, ...invite }, member: { id: userId, ...existing }, status: 'already_pending' }
      }
      if (existing.status === 'rejected') {
        throw new Error('Your previous request to join this group was declined. Please contact the admin.')
      }
      if (existing.status === 'left') {
        throw new Error('You have left this group. Please contact the admin if you want to rejoin.')
      }
    }

    await setDoc(doc(db, 'groups', groupId, 'members', userId), {
      userId,
      displayName,
      email,
      rotationOrder: 0,
      hasReceived: false,
      slots: 1,
      receivedCount: 0,
      status: 'pending',
      joinedAt: serverTimestamp(),
    })
    await ensureMembership(userId, groupId)

    const groupSnap = await getDoc(doc(db, 'groups', groupId))
    if (groupSnap.exists()) {
      const pendingCount = (groupSnap.data().pendingCount || 0) + 1
      await updateDoc(doc(db, 'groups', groupId), { pendingCount })
    }

    return { group: { id: groupId, ...invite }, member: { id: userId }, status: 'pending' }
  }

  async function approveMember(groupId, memberId, slots = 1) {
    const memberRef = doc(db, 'groups', groupId, 'members', memberId)
    const memberDoc = await getDoc(memberRef)
    if (!memberDoc.exists()) return

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    const groupData = groupDoc.exists() ? groupDoc.data() : {}
    const currentCycle = groupData.currentCycle || 0

    const requestedSlots = Math.min(MAX_SLOTS, Math.max(1, Number(slots) || 1))

    const nextOrder = approvedMembers.value.length
      ? approvedMembers.value.reduce(
          (max, m) => Math.max(max, (m.rotationOrder || 0) + memberSlots(m) - 1),
          0,
        ) + 1
      : 1

    await updateDoc(memberRef, {
      status: 'approved',
      rotationOrder: nextOrder,
      slots: requestedSlots,
      receivedCount: 0,
      joinedCycle: currentCycle + 1,
      approvedAt: serverTimestamp(),
    })

    const totalMembers = (groupData.totalMembers || 0) + 1
    const totalSlots = (groupData.totalSlots || 0) + requestedSlots
    const pendingCount = Math.max(0, (groupData.pendingCount || 0) - 1)
    const groupUpdate = { totalMembers, totalSlots, pendingCount }
    if (Array.isArray(groupData.turnOrder)) {
      const newTurnOrder = [...groupData.turnOrder]
      for (let i = 0; i < requestedSlots; i++) newTurnOrder.push(memberId)
      groupUpdate.turnOrder = newTurnOrder
    }
    await updateDoc(doc(db, 'groups', groupId), groupUpdate)

    await createNotification({
      userId: memberId,
      groupId,
      type: 'approved',
      message: `You were approved to join ${groupData.name || 'your group'}.`,
    })
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

  async function setMemberSlots(groupId, memberId, slots) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to do this')

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== uid) throw new Error('Only the group admin can change slots')

    const currentCycle = groupData.currentCycle || 0
    if (currentCycle !== 0) {
      const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
      const eligible = membersSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status === 'approved' && !m.leftAt && (m.joinedCycle ?? 1) <= Math.max(currentCycle, 1))
      const rotationConcluded = eligible.length > 0 && eligible.every((m) => memberReceived(m) >= memberSlots(m))
      if (!rotationConcluded) {
        throw new Error('Slots can only be changed before the first cycle or after every member has received the pot.')
      }
    }

    const memberRef = doc(db, 'groups', groupId, 'members', memberId)
    const memberDoc = await getDoc(memberRef)
    if (!memberDoc.exists()) return
    if (memberDoc.data().status !== 'approved') throw new Error('Only approved members can have slots changed')

    const requestedSlots = Math.min(MAX_SLOTS, Math.max(1, Number(slots) || 1))
    const previousSlots = memberSlots(memberDoc.data())
    const delta = requestedSlots - previousSlots

    const receivedCount = memberReceived(memberDoc.data())
    const hasReceived = receivedCount >= requestedSlots

    await updateDoc(memberRef, {
      slots: requestedSlots,
      hasReceived,
    })

    const totalSlots = Math.max(0, (groupData.totalSlots || 0) + delta)
    const groupUpdate = { totalSlots }
    if (Array.isArray(groupData.turnOrder) && delta !== 0) {
      const newTurnOrder = [...groupData.turnOrder]
      if (delta > 0) {
        for (let i = 0; i < delta; i++) newTurnOrder.push(memberId)
      } else {
        let removed = 0
        for (let i = newTurnOrder.length - 1; i >= 0 && removed < -delta; i--) {
          if (newTurnOrder[i] === memberId) {
            newTurnOrder.splice(i, 1)
            removed++
          }
        }
      }
      groupUpdate.turnOrder = newTurnOrder
    }
    await updateDoc(doc(db, 'groups', groupId), groupUpdate)
  }

  async function saveTurnOrder(groupId, turnOrder) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in')

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== uid) throw new Error('Only the group admin can change the payout schedule')

    const currentCycle = groupData.currentCycle || 0
    if (currentCycle !== 0) {
      const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
      const eligible = membersSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status === 'approved' && !m.leftAt && (m.joinedCycle ?? 1) <= Math.max(currentCycle, 1))
      const rotationConcluded = eligible.length > 0 && eligible.every((m) => memberReceived(m) >= memberSlots(m))
      if (!rotationConcluded) {
        throw new Error('The payout schedule can only be changed before the first cycle or after every member has received the pot.')
      }
    }

    const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
    const allMembers = membersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

    if (!Array.isArray(turnOrder) || !isValidTurnOrder(turnOrder, allMembers)) {
      throw new Error('Invalid payout schedule')
    }

    await updateDoc(doc(db, 'groups', groupId), { turnOrder })
  }

  async function resetTurnOrder(groupId) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in')

    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== uid) throw new Error('Only the group admin can reset the payout schedule')

    const currentCycle = groupData.currentCycle || 0
    if (currentCycle !== 0) {
      const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
      const eligible = membersSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status === 'approved' && !m.leftAt && (m.joinedCycle ?? 1) <= Math.max(currentCycle, 1))
      const rotationConcluded = eligible.length > 0 && eligible.every((m) => memberReceived(m) >= memberSlots(m))
      if (!rotationConcluded) {
        throw new Error('The payout schedule can only be changed before the first cycle or after every member has received the pot.')
      }
    }

    await updateDoc(doc(db, 'groups', groupId), { turnOrder: deleteField() })
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

    const totalMembers = Math.max(0, (groupDoc.data().totalMembers || 1) - 1)
    const totalSlots = Math.max(0, (groupDoc.data().totalSlots || 1) - memberSlots(memberDoc.data()))
    const groupUpdate = { totalMembers, totalSlots }
    if (Array.isArray(groupDoc.data().turnOrder)) {
      groupUpdate.turnOrder = groupDoc.data().turnOrder.filter((id) => id !== memberId)
    }
    await updateDoc(doc(db, 'groups', groupId), groupUpdate)

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

    const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
    const allMembers = membersSnapshot.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
    const eligible = allMembers.filter(
      (m) => m.status === 'approved' && !m.leftAt && (m.joinedCycle ?? 1) <= Math.max(currentCycle, 1),
    )

    if (currentCycle >= 1 && groupData.currentCyclePayoutConfirmed !== true) {
      throw new Error(
        'The current cycle is still in progress. The designated recipient must be marked as paid before a new cycle can start.',
      )
    }

    const newCycle = currentCycle + 1
    const rotationConcluded =
      eligible.length > 0 && eligible.every((m) => memberReceived(m) >= memberSlots(m))

    if (rotationConcluded) {
      for (const m of eligible) {
        await updateDoc(m.ref, { receivedCount: 0, hasReceived: false, joinedCycle: newCycle })
        m.receivedCount = 0
        m.hasReceived = false
        m.joinedCycle = newCycle
      }
    }

    if (eligible.length === 0) {
      throw new Error('This group has no eligible members. Approve members before starting a cycle.')
    }

    const turnOrder = buildTurnOrder(allMembers, groupData)
    const nextEligible = eligible
      .filter((m) => memberReceived(m) < memberSlots(m))
      .sort((a, b) => nextPosition(a, turnOrder) - nextPosition(b, turnOrder))

    const recipient = nextEligible[0] || null
    const newRotation = (groupData.rotation || 1) + (rotationConcluded ? 1 : 0)

    await updateDoc(groupRef, {
      currentCycle: newCycle,
      currentCycleStartDate: new Date(),
      rotation: newRotation,
      currentCycleRecipientId: recipient?.id || null,
      currentCyclePayoutConfirmed: false,
    })

    if (recipient) {
      await setDoc(doc(db, 'groups', groupId, 'cycles', String(newCycle)), {
        cycle: newCycle,
        recipientId: recipient.id,
        recipientName: recipient.displayName || recipient.id,
        rotation: newRotation,
        startedAt: new Date(),
      })

      await createNotification({
        userId: recipient.id,
        groupId,
        type: 'your_turn',
        message: `You are next to receive the pot in ${groupData.name || 'your group'}.`,
      })
    }

    for (const m of eligible) {
      await createNotification({
        userId: m.id,
        groupId,
        type: 'new_cycle',
        message: `Cycle ${newCycle} has started for ${groupData.name || 'your group'}.`,
      })
    }
  }

  async function archiveGroup(groupId) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to do this')
    const groupRef = doc(db, 'groups', groupId)
    const groupDoc = await getDoc(groupRef)
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== uid) throw new Error('Only the group admin can archive this group')
    if (groupData.status === 'completed') throw new Error('Group is already archived')

    if (groupData.currentCycle > 0) {
      const membersSnap = await getDocs(collection(db, 'groups', groupId, 'members'))
      const eligible = membersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status === 'approved' && !m.leftAt && (m.joinedCycle ?? 1) <= groupData.currentCycle)
      const rotationConcluded = eligible.length > 0 && eligible.every((m) => memberReceived(m) >= memberSlots(m))
      if (!rotationConcluded) {
        throw new Error('Cannot archive: the current rotation is still in progress. Every member must receive the pot first.')
      }
    }

    await updateDoc(groupRef, {
      status: 'completed',
      archivedAt: serverTimestamp(),
    })
  }

  async function deleteGroup(groupId) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to do this')
    const groupRef = doc(db, 'groups', groupId)
    const groupDoc = await getDoc(groupRef)
    if (!groupDoc.exists()) throw new Error('Group not found')
    const groupData = groupDoc.data()
    if (groupData.adminId !== uid) throw new Error('Only the group admin can delete this group')
    if (groupData.currentCycle > 0) {
      throw new Error('Cannot delete a group with active cycles. Archive it instead.')
    }

    const contribSnap = await getDocs(collection(db, 'groups', groupId, 'contributions'))
    if (contribSnap.docs.length > 0) {
      throw new Error('Cannot delete a group with contribution history. Archive it instead.')
    }

    await deleteDoc(groupRef)

    const uid2 = auth.currentUser?.uid
    if (uid2) {
      const userDoc = await getDoc(doc(db, 'users', uid2))
      if (userDoc.exists()) {
        const memberGroupIds = userDoc.data().memberGroupIds || []
        if (memberGroupIds.includes(groupId)) {
          await updateDoc(doc(db, 'users', uid2), { memberGroupIds: arrayRemove(groupId) })
        }
      }
    }
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
      const memberSnapshots = await Promise.all(
        adminSnapshot.docs.map((groupDoc) =>
          getDocs(collection(db, 'groups', groupDoc.id, 'members')),
        ),
      )
      const results = []
      adminSnapshot.docs.forEach((groupDoc, i) => {
        const membersSnapshot = memberSnapshots[i]
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
      })
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
    subscribeUserGroups,
    unsubscribeUserGroups,
    generateInviteLink,
    getGroupByInviteCode,
    joinGroupByInvite,
    approveMember,
    rejectMember,
    removeMember,
    setMemberSlots,
    saveTurnOrder,
    resetTurnOrder,
    startNewCycle,
    archiveGroup,
    deleteGroup,
    syncMemberDisplayName,
    fetchPendingRequests,
  }
})
