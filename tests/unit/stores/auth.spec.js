import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn((cb) => {
      cb(null)
      return vi.fn()
    }),
    currentUser: null,
  },
  db: {},
}))

import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with loading true and user null', () => {
    const store = useAuthStore()
    expect(store.loading).toBe(true)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('sets user after init', () => {
    const store = useAuthStore()
    store.init()
    expect(store.loading).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
