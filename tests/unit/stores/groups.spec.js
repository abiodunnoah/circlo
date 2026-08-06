import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockQuery: vi.fn((...args) => ({ type: 'query', args })),
  mockWhere: vi.fn((...args) => ({ type: 'where', args })),
  mockCollection: vi.fn((...args) => ({ type: 'collection', args })),
  mockCollectionGroup: vi.fn((...args) => ({ type: 'collectionGroup', args })),
  mockDoc: vi.fn((...args) => ({ type: 'doc', args })),
  mockServerTimestamp: vi.fn(() => 'TIMESTAMP'),
  mockOnSnapshot: vi.fn(),
  mockArrayUnion: vi.fn((value) => ({ type: 'arrayUnion', value })),
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
  query: mocks.mockQuery,
  where: mocks.mockWhere,
  collection: mocks.mockCollection,
  collectionGroup: mocks.mockCollectionGroup,
  doc: mocks.mockDoc,
  onSnapshot: mocks.mockOnSnapshot,
  serverTimestamp: mocks.mockServerTimestamp,
  arrayUnion: mocks.mockArrayUnion,
}))

import { useGroupsStore } from '@/stores/groups'

describe('groups store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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
    expect(mocks.mockSetDoc).toHaveBeenCalledTimes(1)
    const memberDoc = mocks.mockSetDoc.mock.calls[0][1]
    expect(memberDoc.rotationOrder).toBe(1)
    expect(memberDoc.status).toBe('approved')
    expect(memberDoc.hasReceived).toBe(false)
    expect(memberDoc.joinedCycle).toBe(1)
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
    mocks.mockGetDocs.mockResolvedValue({ empty: true, docs: [] })
    const store = useGroupsStore()

    await expect(store.joinGroupByInvite('bad-code', 'user-2', 'Amara', 'a@t.com')).rejects.toThrow(
      'Invalid invite link',
    )
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

  it('startNewCycle rejects when the current cycle is still in progress', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ currentCycle: 1 }) })
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', ref: {}, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: false }) },
      ],
    })
    const store = useGroupsStore()

    await expect(store.startNewCycle('group-1')).rejects.toThrow('still in progress')
    expect(mocks.mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('startNewCycle increments the cycle and resets received status when concluded', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ currentCycle: 1 }) })
    mocks.mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: true }) },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          { id: 'a', ref: { id: 'a' }, data: () => ({ status: 'approved', leftAt: null, joinedCycle: 1, hasReceived: true }) },
        ],
      })
    const store = useGroupsStore()

    await store.startNewCycle('group-1')

    const groupUpdate = mocks.mockUpdateDoc.mock.calls[0][1]
    expect(groupUpdate.currentCycle).toBe(2)
    const memberUpdate = mocks.mockUpdateDoc.mock.calls[1][1]
    expect(memberUpdate.hasReceived).toBe(false)
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
    mocks.mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'g1', data: () => ({ inviteCode: 'code1', adminId: 'admin-1' }) }],
    })
    mocks.mockGetDoc
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
})
