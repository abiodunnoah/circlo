import { describe, it, expect, vi } from 'vitest'

vi.mock('@/firebase', () => ({
  auth: { currentUser: { uid: 'admin-1' } },
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ type: 'collection', args })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn((...args) => ({ type: 'doc', args })),
}))

import { buildCycleRows } from '@/stores/reports'

const members = [
  { id: 'a', displayName: 'Ada', status: 'approved', joinedCycle: 1 },
  { id: 'b', displayName: 'Bola', status: 'approved', joinedCycle: 1 },
  { id: 'c', displayName: 'Chidi', status: 'approved', joinedCycle: 1 },
  { id: 'd', displayName: 'Dara', status: 'left', joinedCycle: 1 },
  { id: 'e', displayName: 'Emeka', status: 'approved', joinedCycle: 2 },
]

const cycles = [
  { cycle: '1', recipientId: 'a', recipientName: 'Ada' },
  { cycle: '2', recipientId: 'b', recipientName: 'Bola', receivedAt: 'T' },
]

const contributions = [
  { userId: 'a', cycle: 1, amount: 5000, status: 'paid' },
  { userId: 'b', cycle: 1, amount: 5000, status: 'paid' },
  { userId: 'c', cycle: 1, amount: 5000, status: 'void' },
  { userId: 'a', cycle: 2, amount: 5000, status: 'paid' },
  { userId: 'b', cycle: 2, amount: 5000, status: 'paid' },
]

describe('buildCycleRows', () => {
  it('summarises each cycle with collected totals, recipient and counts', () => {
    const rows = buildCycleRows(cycles, contributions, members)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      cycle: 1,
      totalCollected: 10000,
      recipientName: 'Ada',
      paidCount: 2,
      totalCount: 3,
      allPaid: false,
    })
    expect(rows[0].receivedAt).toBeNull()
    expect(rows[1]).toMatchObject({
      cycle: 2,
      totalCollected: 10000,
      recipientName: 'Bola',
      paidCount: 2,
      totalCount: 4,
      allPaid: false,
      receivedAt: 'T',
    })
  })

  it('excludes voided contributions from the collected total', () => {
    const rows = buildCycleRows(cycles, contributions, members)
    expect(rows[0].totalCollected).toBe(10000)
    expect(rows[0].paidCount).toBe(2)
  })

  it('excludes members who left or joined after the cycle', () => {
    const rows = buildCycleRows(cycles, contributions, members)
    expect(rows[0].totalCount).toBe(3)
    expect(rows[1].totalCount).toBe(4)
  })

  it('falls back to the member displayName when recipientName is missing', () => {
    const rows = buildCycleRows(
      [{ cycle: '1', recipientId: 'a' }],
      contributions,
      members,
    )
    expect(rows[0].recipientName).toBe('Ada')
  })

  it('sorts cycles ascending regardless of input order', () => {
    const rows = buildCycleRows([...cycles].reverse(), contributions, members)
    expect(rows.map((r) => r.cycle)).toEqual([1, 2])
  })

  it('derives rows from contributions when no cycle docs exist', () => {
    const rows = buildCycleRows([], contributions, members)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      cycle: 1,
      totalCollected: 10000,
      recipientName: '—',
      paidCount: 2,
      totalCount: 3,
    })
    expect(rows[1]).toMatchObject({
      cycle: 2,
      totalCollected: 10000,
      recipientName: '—',
    })
  })

  it('includes the currentCycle even when no contributions exist yet', () => {
    const rows = buildCycleRows([], [], members, 3)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      cycle: 3,
      totalCollected: 0,
      recipientName: '—',
      paidCount: 0,
      totalCount: 4,
      allPaid: false,
    })
  })

  it('returns empty when nothing exists', () => {
    const rows = buildCycleRows([], [], [], 0)
    expect(rows).toHaveLength(0)
  })
})