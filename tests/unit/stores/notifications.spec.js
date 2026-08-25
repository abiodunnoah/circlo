import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockWriteBatch: vi.fn(() => ({ update: vi.fn(), commit: vi.fn().mockResolvedValue() })),
  mockQuery: vi.fn((...args) => ({ type: 'query', args })),
  mockWhere: vi.fn((...args) => ({ type: 'where', args })),
  mockOrderBy: vi.fn((...args) => ({ type: 'orderBy', args })),
  mockCollection: vi.fn((...args) => ({ type: 'collection', args })),
  mockDoc: vi.fn((...args) => ({ type: 'doc', args })),
  mockOnSnapshot: vi.fn(),
  mockServerTimestamp: vi.fn(() => 'TIMESTAMP'),
}))

vi.mock('@/firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.mockAddDoc,
  updateDoc: mocks.mockUpdateDoc,
  writeBatch: mocks.mockWriteBatch,
  query: mocks.mockQuery,
  where: mocks.mockWhere,
  orderBy: mocks.mockOrderBy,
  collection: mocks.mockCollection,
  doc: mocks.mockDoc,
  onSnapshot: mocks.mockOnSnapshot,
  serverTimestamp: mocks.mockServerTimestamp,
}))

import { createNotification, useNotificationsStore } from '@/stores/notifications'

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('subscribeNotifications streams the current user notifications and counts unread', () => {
    const unsub = vi.fn()
    mocks.mockOnSnapshot.mockImplementation((_q, cb) => {
      cb({
        docs: [
          { id: 'n1', data: () => ({ userId: 'user-1', type: 'paid', message: 'Payment recorded', read: false, createdAt: 'T' }) },
          { id: 'n2', data: () => ({ userId: 'user-1', type: 'new_cycle', message: 'New cycle', read: true, createdAt: 'T' }) },
        ],
      })
      return unsub
    })
    const store = useNotificationsStore()

    store.subscribeNotifications()

    expect(mocks.mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1')
    expect(store.notifications).toHaveLength(2)
    expect(store.unreadCount).toBe(1)

    store.unsubscribeNotifications()
    expect(unsub).toHaveBeenCalledTimes(1)
  })

  it('markAsRead updates the notification doc and decrements the unread count', async () => {
    const store = useNotificationsStore()
    store.notifications = [{ id: 'n1', read: false }, { id: 'n2', read: true }]
    store.unreadCount = 1

    await store.markAsRead('n1')

    expect(mocks.mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), { read: true })
    expect(store.unreadCount).toBe(0)
  })

  it('markAllAsRead commits a batch and resets the unread count', async () => {
    const store = useNotificationsStore()
    store.notifications = [{ id: 'n1', read: false }, { id: 'n2', read: false }]
    store.unreadCount = 2

    await store.markAllAsRead()

    expect(mocks.mockWriteBatch).toHaveBeenCalledTimes(1)
    expect(store.unreadCount).toBe(0)
  })

  it('createNotification writes a notification doc to the notifications collection', async () => {
    await createNotification({ userId: 'user-2', groupId: 'group-1', type: 'paid', message: 'Ada paid cycle 3' })

    const [ref, data] = mocks.mockAddDoc.mock.calls[0]
    expect(ref.args).toContain('notifications')
    expect(data).toMatchObject({
      userId: 'user-2',
      groupId: 'group-1',
      type: 'paid',
      message: 'Ada paid cycle 3',
      read: false,
      createdAt: 'TIMESTAMP',
    })
  })
})