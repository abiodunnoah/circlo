import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockQuery: vi.fn((...args) => ({ type: 'query', args })),
  mockWhere: vi.fn((...args) => ({ type: 'where', args })),
  mockCollection: vi.fn((...args) => ({ type: 'collection', args })),
  mockCollectionGroup: vi.fn((...args) => ({ type: 'collectionGroup', args })),
  mockDoc: vi.fn((...args) => ({ type: 'doc', args })),
  mockServerTimestamp: vi.fn(() => 'TIMESTAMP'),
  mockOnSnapshot: vi.fn(),
  mockArrayUnion: vi.fn((value) => ({ type: 'arrayUnion', value })),
  mockArrayRemove: vi.fn((value) => ({ type: 'arrayRemove', value })),
  mockDeleteField: vi.fn(() => 'DELETE_FIELD'),
}))

vi.mock('@/firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.mockAddDoc,
  setDoc: mocks.mockSetDoc,
  getDocs: mocks.mockGetDocs,
  getDoc: mocks.mockGetDoc,
  updateDoc: mocks.mockUpdateDoc,
  deleteDoc: mocks.mockDeleteDoc,
  query: mocks.mockQuery,
  where: mocks.mockWhere,
  collection: mocks.mockCollection,
  collectionGroup: mocks.mockCollectionGroup,
  doc: mocks.mockDoc,
  onSnapshot: mocks.mockOnSnapshot,
  serverTimestamp: mocks.mockServerTimestamp,
  arrayUnion: mocks.mockArrayUnion,
  arrayRemove: mocks.mockArrayRemove,
  deleteField: mocks.mockDeleteField,
}))

import { useGroupsStore } from '@/stores/groups'

describe('groups store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('createGroup creates a group doc with the admin as first approved member', async () => {
    mocks.mockAddDoc.mockResolvedValue({ id: 'group-1' })
    const store = useGroupsStore()

    const id = await store.createGroup({
      name: 'Family Savings',
      amount: '50000',
      frequency: 'monthly',
      startDate: '2025-08-01',
      adminId: 'user-1',
      adminName: 'Chidi',
      adminEmail: 'chidi@test.com',
    })

    expect(id).toBe('group-1')
    expect(mocks.mockAddDoc).toHaveBeenCalledTimes(1)
    expect(mocks.mockSetDoc).toHaveBeenCalledTimes(3)
    const inviteDoc = mocks.mockSetDoc.mock.calls[0][1]
    expect(inviteDoc.groupId).toBe('group-1')
    expect(inviteDoc.groupName).toBe('Family Savings')
    const memberDoc = mocks.mockSetDoc.mock.calls[1][1]
    expect(memberDoc.rotationOrder).toBe(1)
    expect(memberDoc.status).toBe('approved')
    expect(memberDoc.hasReceived).toBe(false)
    expect(memberDoc.joinedCycle).toBe(1)
    const userDoc = mocks.mockSetDoc.mock.calls[2][1]
    expect(userDoc.memberGroupIds).toEqual({ type: 'arrayUnion', value: 'group-1' })
  })

  it('createGroup rejects an empty start date', async () => {
    const store = useGroupsStore()
    await expect(
      store.createGroup({
        name: 'Family Savings',
        amount: '50000',
        frequency: 'monthly',
        startDate: '',
        adminId: 'user-1',
        adminName: 'Chidi',
        adminEmail: 'chidi@test.com',
      }),
    ).rejects.toThrow('valid start date')
    expect(mocks.mockAddDoc).not.toHaveBeenCalled()
  })

  it('rejects an invalid invite code when joining', async () => {
    mocks.mockGetDoc.mockResolvedValue({ exists: () => false })
    const store = useGroupsStore()

    await expect(store.joinGroupByInvite('bad-code', 'user-2', 'Amara', 'a@t.com')).rejects.toThrow(
      'Invalid invite link',
    )
  })

  it('joinGroupByInvite rejects a member whose previous request was declined', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ groupId: 'g1', groupName: 'Test Group', adminId: 'admin-1' }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-2', status: 'rejected' }),
      })
    const store = useGroupsStore()

    await expect(store.joinGroupByInvite('code1', 'user-2', 'Amara', 'a@t.com')).rejects.toThrow(
      'request to join this group was declined',
    )
    expect(mocks.mockSetDoc).not.toHaveBeenCalled()
  })

  it('mid-rotation joins are blocked server-side by the member-create rule', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ groupId: 'g1', groupName: 'Test Group', adminId: 'admin-1' }),
      })
      .mockResolvedValueOnce({ exists: () => false })
    const store = useGroupsStore()

    await expect(store.joinGroupByInvite('code1', 'user-2', 'Amara', 'a@t.com')).rejects.toThrow()
  })

  it('startNewCycle throws when the group has no eligible members', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ currentCycle: 0, currentCycleRecipientId: null, rotation: 0 }),
    })
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] })
    const store = useGroupsStore()

    await expect(store.startNewCycle('group-1')).rejects.toThrow('no eligible members')
    expect(mocks.mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('removeMember marks member as left and decrements totalMembers', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'user-1', totalMembers: 3 }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-2', status: 'approved' }) })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'user-1', data: () => ({ userId: 'user-1', status: 'approved', rotationOrder: 1 }) },
        { id: 'user-3', data: () => ({ userId: 'user-3', status: 'approved', rotationOrder: 2 }) },
      ],
    })
    const store = useGroupsStore()

    await store.removeMember('group-1', 'user-2')

    const memberUpdate = mocks.mockUpdateDoc.mock.calls.find(
      ([docRef]) => docRef.args[3] === 'members',
    )
    expect(memberUpdate).toBeTruthy()
    expect(memberUpdate[1].status).toBe('left')
    const userDocUpdate = mocks.mockUpdateDoc.mock.calls.find(
      ([docRef]) => docRef.args[1] === 'users',
    )
    expect(userDocUpdate).toBeFalsy()
  })

  it('subscribeToGroup returns a cleanup function that unsubscribes both listeners', () => {
    const unsub = vi.fn()
    mocks.mockOnSnapshot.mockReturnValue(unsub)
    const store = useGroupsStore()

    const cleanup = store.subscribeToGroup('group-1')
    expect(typeof cleanup).toBe('function')
    expect(mocks.mockOnSnapshot).toHaveBeenCalledTimes(2)

    cleanup()
    expect(unsub).toHaveBeenCalledTimes(2)
    expect(store.currentGroupStatus).toBe('idle')
  })

  it('removeMember throws when trying to remove the group admin', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'user-1', totalMembers: 3 }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-1', status: 'approved' }) })
    const store = useGroupsStore()

    await expect(store.removeMember('group-1', 'user-1')).rejects.toThrow('admin cannot be removed')
  })

  it('approveMember assigns rotation order and joinedCycle for the next cycle', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-2', status: 'pending' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ currentCycle: 2, totalMembers: 3, pendingCount: 1 }) })
    const store = useGroupsStore()

    await store.approveMember('group-1', 'user-2')

    const memberUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(memberUpdate.status).toBe('approved')
    expect(memberUpdate.rotationOrder).toBe(1)
    expect(memberUpdate.joinedCycle).toBe(3)

    const groupUpdate = mocks.mockUpdateDoc.mock.calls[1][1]
    expect(groupUpdate.totalMembers).toBe(4)
    expect(groupUpdate.pendingCount).toBe(0)
  })

  it('startNewCycle rejects when the current cycle recipient has not been paid', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ currentCycle: 1, currentCycleRecipientId: 'a', rotation: 1 }),
    })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: false }) },
        { id: 'b', ref: { id: 'b' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: false }) },
      ],
    })
    const store = useGroupsStore()

    await expect(store.startNewCycle('group-1')).rejects.toThrow('still in progress')
    expect(mocks.mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('startNewCycle advances the rotation when all eligible members have received', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ currentCycle: 2, currentCycleRecipientId: 'b', rotation: 1, currentCyclePayoutConfirmed: true }),
    })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: true }) },
        { id: 'b', ref: { id: 'b' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: true }) },
      ],
    })
    const store = useGroupsStore()

    await store.startNewCycle('group-1')

    expect(mocks.mockUpdateDoc).toHaveBeenCalledTimes(3)
    const memberUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(memberUpdate.hasReceived).toBe(false)
    expect(memberUpdate.joinedCycle).toBe(3)
    const groupUpdate = mocks.mockUpdateDoc.mock.calls[2][1]
    expect(groupUpdate.currentCycle).toBe(3)
    expect(groupUpdate.rotation).toBe(2)
    expect(groupUpdate.currentCycleRecipientId).toBe('a')
  })

  it('startNewCycle advances within a rotation without resetting received status', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ currentCycle: 1, currentCycleRecipientId: 'a', rotation: 1, currentCyclePayoutConfirmed: true }),
    })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: true }) },
        { id: 'b', ref: { id: 'b' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: false }) },
      ],
    })
    const store = useGroupsStore()

    await store.startNewCycle('group-1')

    expect(mocks.mockUpdateDoc).toHaveBeenCalledTimes(1)
    const groupUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(groupUpdate.currentCycle).toBe(2)
    expect(groupUpdate.rotation).toBe(1)
    expect(groupUpdate.currentCycleRecipientId).toBe('b')
  })

  it('fetchUserGroups surfaces membership status on member groups', async () => {
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] })
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ memberGroupIds: ['group-1'] }) })
      .mockResolvedValueOnce({
        exists: () => true,
        id: 'group-1',
        data: () => ({ name: 'Savings', currentCycle: 0, totalMembers: 2 }),
      })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'pending', userId: 'user-1' }) })
    const store = useGroupsStore()

    await store.fetchUserGroups()

    expect(store.groups).toHaveLength(1)
    expect(store.groups[0].id).toBe('group-1')
    expect(store.groups[0].role).toBe('member')
    expect(store.groups[0].membershipStatus).toBe('pending')
  })

  it('records membership on the user doc when joining a group', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ groupId: 'g1', groupName: 'Test Group', adminId: 'admin-1' }),
      })
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ pendingCount: 0 }) })
    const store = useGroupsStore()

    await store.joinGroupByInvite('code1', 'user-2', 'Amara', 'a@t.com')

    const userDocUpdate = mocks.mockSetDoc.mock.calls.find(([docRef]) => docRef.args[1] === 'users')
    expect(userDocUpdate).toBeTruthy()
    expect(userDocUpdate[1].memberGroupIds).toEqual({ type: 'arrayUnion', value: 'g1' })
  })

  it('fetchPendingRequests flattens pending members across admin groups', async () => {
    mocks.mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          { id: 'g1', data: () => ({ name: 'Family Savings' }) },
          { id: 'g2', data: () => ({ name: 'Market Ajo' }) },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          { id: 'u2', data: () => ({ status: 'pending', displayName: 'Amara', joinedAt: 2 }) },
          { id: 'u3', data: () => ({ status: 'approved', displayName: 'Bola' }) },
        ],
      })
      .mockResolvedValueOnce({
        docs: [{ id: 'u4', data: () => ({ status: 'pending', displayName: 'Chidi', joinedAt: 1 }) }],
      })
    const store = useGroupsStore()

    await store.fetchPendingRequests()

    expect(store.pendingRequests).toHaveLength(2)
    expect(store.pendingRequests[0]).toMatchObject({ groupId: 'g1', groupName: 'Family Savings' })
    expect(store.pendingRequests[0].member.displayName).toBe('Amara')
    expect(store.pendingRequests[1]).toMatchObject({ groupId: 'g2', groupName: 'Market Ajo' })
  })

  it('syncMemberDisplayName updates the member doc in each of the user groups', async () => {
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'g1', data: () => ({}) }] })
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ memberGroupIds: ['g2'] }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-1' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-1' }) })
    const store = useGroupsStore()

    await store.syncMemberDisplayName('user-1', 'New Name')

    expect(mocks.mockUpdateDoc).toHaveBeenCalledTimes(2)
    expect(mocks.mockUpdateDoc.mock.calls[0][1]).toEqual({ displayName: 'New Name' })
    expect(mocks.mockUpdateDoc.mock.calls[1][1]).toEqual({ displayName: 'New Name' })
  })

  it('approveMember accepts a slots parameter and updates totalSlots', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-2', status: 'pending' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ currentCycle: 0, totalMembers: 3, totalSlots: 3, pendingCount: 1 }) })
    const store = useGroupsStore()

    await store.approveMember('group-1', 'user-2', 3)

    const memberUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(memberUpdate.slots).toBe(3)
    expect(memberUpdate.receivedCount).toBe(0)

    const groupUpdate = mocks.mockUpdateDoc.mock.calls[1][1]
    expect(groupUpdate.totalMembers).toBe(4)
    expect(groupUpdate.totalSlots).toBe(6)
  })

  it('approveMember clamps slots to the 1..10 range', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-2', status: 'pending' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ currentCycle: 0, totalMembers: 1, totalSlots: 1, pendingCount: 1 }) })
    const store = useGroupsStore()

    await store.approveMember('group-1', 'user-2', 99)

    const memberUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(memberUpdate.slots).toBe(10)
  })

  it('setMemberSlots updates slots, hasReceived, and totalSlots', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'user-1', currentCycle: 0, totalSlots: 2 }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'approved', slots: 1, receivedCount: 0 }) })
    const store = useGroupsStore()

    await store.setMemberSlots('group-1', 'user-2', 4)

    const memberUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(memberUpdate.slots).toBe(4)
    expect(memberUpdate.hasReceived).toBe(false)

    const groupUpdate = mocks.mockUpdateDoc.mock.calls[1][1]
    expect(groupUpdate.totalSlots).toBe(5)
  })

  it('setMemberSlots rejects mid-rotation changes', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ adminId: 'user-1', currentCycle: 2, totalSlots: 2 }),
    })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ status: 'approved', joinedCycle: 1, hasReceived: true }) },
        { id: 'b', data: () => ({ status: 'approved', joinedCycle: 1, hasReceived: false }) },
      ],
    })
    const store = useGroupsStore()

    await expect(store.setMemberSlots('group-1', 'user-2', 2)).rejects.toThrow('only be changed')
    expect(mocks.mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('startNewCycle re-selects a multi-slot member until all their slots are received', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ currentCycle: 2, currentCycleRecipientId: 'b', rotation: 1, currentCyclePayoutConfirmed: true }),
    })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 1, slots: 1, receivedCount: 1 }) },
        { id: 'b', ref: { id: 'b' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 2, slots: 2, receivedCount: 1 }) },
        { id: 'c', ref: { id: 'c' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 4, slots: 1, receivedCount: 0 }) },
      ],
    })
    const store = useGroupsStore()

    await store.startNewCycle('group-1')

    const groupUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(groupUpdate.currentCycle).toBe(3)
    expect(groupUpdate.currentCycleRecipientId).toBe('b')
    expect(groupUpdate.rotation).toBe(1)
  })

  it('startNewCycle concludes a rotation only when all slots are received', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ currentCycle: 3, currentCycleRecipientId: 'b', rotation: 1, currentCyclePayoutConfirmed: true }),
    })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 1, slots: 1, receivedCount: 1 }) },
        { id: 'b', ref: { id: 'b' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 2, slots: 2, receivedCount: 2 }) },
        { id: 'c', ref: { id: 'c' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 4, slots: 1, receivedCount: 1 }) },
      ],
    })
    const store = useGroupsStore()

    await store.startNewCycle('group-1')

    const memberUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(memberUpdate.receivedCount).toBe(0)
    expect(memberUpdate.hasReceived).toBe(false)

    const groupUpdate = mocks.mockUpdateDoc.mock.calls[3][1]
    expect(groupUpdate.rotation).toBe(2)
    expect(groupUpdate.currentCycleRecipientId).toBe('a')
  })

  it('joinGroupByInvite returns already_pending when a request already exists', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ groupId: 'g1', groupName: 'Test Group', adminId: 'admin-1' }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-2', status: 'pending', joinedAt: 1 }),
      })
    const store = useGroupsStore()

    const result = await store.joinGroupByInvite('code1', 'user-2', 'Amara', 'a@t.com')

    expect(result.status).toBe('already_pending')
    expect(result.member.id).toBe('user-2')
  })

  it('startNewCycle uses turnOrder for interleaved recipient selection', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'user-1', currentCycle: 0, currentCyclePayoutConfirmed: true, turnOrder: ['a', 'b', 'a', 'c'] }) })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 1, receivedCount: 0, slots: 2 }) },
        { id: 'b', ref: { id: 'b' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 2, receivedCount: 0, slots: 1 }) },
        { id: 'c', ref: { id: 'c' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 3, receivedCount: 0, slots: 1 }) },
      ],
    })
    const store = useGroupsStore()

    await store.startNewCycle('group-1')

    const groupUpdate = mocks.mockUpdateDoc.mock.calls.find((c) => c[0].type === 'doc' && c[1].currentCycleRecipientId)?.[1]
    expect(groupUpdate?.currentCycleRecipientId).toBe('a')
    expect(groupUpdate?.currentCycle).toBe(1)
  })

  it('startNewCycle picks interleaved second turn correctly', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'user-1', currentCycle: 1, currentCyclePayoutConfirmed: true, turnOrder: ['a', 'b', 'a', 'c'] }) })
    mocks.mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 1, receivedCount: 1, slots: 2 }) },
          { id: 'b', ref: { id: 'b' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 2, receivedCount: 0, slots: 1 }) },
          { id: 'c', ref: { id: 'c' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, rotationOrder: 3, receivedCount: 0, slots: 1 }) },
        ],
      })
    const store = useGroupsStore()

    await store.startNewCycle('group-1')

    const groupUpdate = mocks.mockUpdateDoc.mock.calls.find((c) => c[0].type === 'doc' && c[1].currentCycleRecipientId)?.[1]
    expect(groupUpdate?.currentCycleRecipientId).toBe('b')
  })

  it('saveTurnOrder persists valid turn order', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'user-1', currentCycle: 0 }) })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ status: 'approved', leftAt: null, slots: 2 }) },
        { id: 'b', data: () => ({ status: 'approved', leftAt: null, slots: 1 }) },
      ],
    })
    const store = useGroupsStore()

    await store.saveTurnOrder('group-1', ['a', 'b', 'a'])

    const updateCall = mocks.mockUpdateDoc.mock.calls.find((c) => c[0].type === 'doc' && c[1].turnOrder)
    expect(updateCall[1].turnOrder).toEqual(['a', 'b', 'a'])
  })

  it('saveTurnOrder rejects invalid turn order', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'user-1', currentCycle: 0 }) })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ status: 'approved', leftAt: null, slots: 2 }) },
        { id: 'b', data: () => ({ status: 'approved', leftAt: null, slots: 1 }) },
      ],
    })
    const store = useGroupsStore()

    await expect(store.saveTurnOrder('group-1', ['a', 'b'])).rejects.toThrow('Invalid payout schedule')
  })

  it('saveTurnOrder rejects non-admin users', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'someone-else', currentCycle: 0 }) })
    const store = useGroupsStore()

    await expect(store.saveTurnOrder('group-1', ['a', 'b', 'a'])).rejects.toThrow('Only the group admin')
  })
})
