import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockQuery: vi.fn((...args) => ({ type: 'query', args })),
  mockWhere: vi.fn((...args) => ({ type: 'where', args })),
  mockCollection: vi.fn((...args) => ({ type: 'collection', args })),
  mockDoc: vi.fn((...args) => ({ type: 'doc', args })),
  mockOnSnapshot: vi.fn(),
  mockServerTimestamp: vi.fn(() => 'TIMESTAMP'),
}))

vi.mock('@/firebase', () => ({
  auth: { currentUser: { uid: 'admin-1' } },
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  getDocs: mocks.mockGetDocs,
  getDoc: mocks.mockGetDoc,
  setDoc: mocks.mockSetDoc,
  updateDoc: mocks.mockUpdateDoc,
  query: mocks.mockQuery,
  where: mocks.mockWhere,
  collection: mocks.mockCollection,
  doc: mocks.mockDoc,
  onSnapshot: mocks.mockOnSnapshot,
  serverTimestamp: mocks.mockServerTimestamp,
}))

import { useContributionsStore } from '@/stores/contributions'

describe('contributions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('markAsPaid creates a contribution doc with a deterministic id for any eligible member', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'admin-1', contributionAmount: 5000, currentCycle: 3, currentCycleRecipientId: 'user-3' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-2', status: 'approved' }) })
    const store = useContributionsStore()

    const result = await store.markAsPaid('group-1', 'user-2', 3)

    const setDocCall = mocks.mockSetDoc.mock.calls[0]
    expect(setDocCall[0].args[3]).toBe('contributions')
    expect(setDocCall[0].args[4]).toBe('3_user-2')
    expect(setDocCall[1]).toMatchObject({
      userId: 'user-2',
      cycle: 3,
      amount: 5000,
      markedBy: 'admin-1',
      status: 'paid',
    })

    expect(mocks.mockUpdateDoc).not.toHaveBeenCalled()
    expect(result.id).toBe('3_user-2')
  })

  it('markAsPaid rejects when the member is not an approved member of the group', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'admin-1', contributionAmount: 5000 }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-2', status: 'left' }) })
    const store = useContributionsStore()

    await expect(store.markAsPaid('group-1', 'user-2', 3)).rejects.toThrow('not an approved member')
    expect(mocks.mockSetDoc).not.toHaveBeenCalled()
  })

  it('confirmPayout marks the current cycle recipient as received', async () => {
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'admin-1', currentCycle: 3, currentCycleRecipientId: 'user-2' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user-2', status: 'approved' }) })
    const store = useContributionsStore()

    await store.confirmPayout('group-1', 'user-2', 3)

    expect(mocks.mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { hasReceived: true },
    )
  })

  it('confirmPayout rejects when the member is not the current cycle recipient', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'admin-1', currentCycle: 3, currentCycleRecipientId: 'user-2' }) })
    const store = useContributionsStore()

    await expect(store.confirmPayout('group-1', 'user-9', 3)).rejects.toThrow('current cycle recipient')
    expect(mocks.mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('markAsPaid rejects when the current user is not the group admin', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'someone-else', contributionAmount: 5000 }) })
    const store = useContributionsStore()

    await expect(store.markAsPaid('group-1', 'user-2', 3)).rejects.toThrow('Only the group admin')
    expect(mocks.mockSetDoc).not.toHaveBeenCalled()
  })

  it('voidContribution soft-voids the record without touching member received status', async () => {
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ adminId: 'admin-1', currentCycle: 3, currentCycleRecipientId: 'user-2' }) })
    const store = useContributionsStore()

    await store.voidContribution('group-1', 'user-2', 3)

    const setDocCall = mocks.mockSetDoc.mock.calls[0]
    expect(setDocCall[1]).toMatchObject({ status: 'void', voidedBy: 'admin-1' })
    expect(setDocCall[2]).toEqual({ merge: true })
    expect(mocks.mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('subscribeToCycleContributions queries the cycle and returns an unsubscribe function', () => {
    const unsub = vi.fn()
    const snapshot = {
      docs: [
        {
          id: '3_user-2',
          data: () => ({ userId: 'user-2', cycle: 3, amount: 5000, status: 'paid' }),
        },
      ],
    }
    mocks.mockOnSnapshot.mockImplementation((_q, cb) => {
      cb(snapshot)
      return unsub
    })
    const store = useContributionsStore()

    const cleanup = store.subscribeToCycleContributions('group-1', 3)

    expect(mocks.mockWhere).toHaveBeenCalledWith('cycle', '==', 3)
    expect(store.contributions).toHaveLength(1)
    expect(store.contributionsByMember['user-2'].status).toBe('paid')
    expect(store.contributionsLoading).toBe(false)

    cleanup()
    expect(unsub).toHaveBeenCalledTimes(1)
  })

  it('fetchMyContributions sums the user total and attaches group/member names', async () => {
    mocks.mockGetDocs
      .mockResolvedValueOnce({ docs: [{ id: 'g1', data: () => ({}) }] })
      .mockResolvedValueOnce({
        docs: [
          { id: 'c1', data: () => ({ userId: 'admin-1', cycle: 1, amount: 5000, status: 'paid' }) },
          { id: 'c2', data: () => ({ userId: 'admin-1', cycle: 2, amount: 5000, status: 'paid' }) },
          { id: 'c3', data: () => ({ userId: 'other', cycle: 1, amount: 5000, status: 'paid' }) },
        ],
      })
      .mockResolvedValueOnce({
        docs: [{ id: 'admin-1', data: () => ({ userId: 'admin-1', displayName: 'Chidi' }) }],
      })
    mocks.mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ memberGroupIds: ['g1'] }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Family Savings' }) })
    const store = useContributionsStore()

    await store.fetchMyContributions()

    expect(store.myContributions).toHaveLength(2)
    expect(store.myContributions[0]).toMatchObject({ groupName: 'Family Savings', memberName: 'Chidi' })
    expect(store.myTotalContributed).toBe(10000)
  })
})
