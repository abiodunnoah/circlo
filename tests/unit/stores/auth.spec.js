import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockOnAuthStateChanged: vi.fn(),
  mockSignIn: vi.fn(),
  mockCreateUser: vi.fn(),
  mockSignOut: vi.fn(),
  mockUpdateProfile: vi.fn(),
  mockDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockServerTimestamp: vi.fn(),
}))

vi.mock('@/firebase', () => ({
  auth: {
    onAuthStateChanged: mocks.mockOnAuthStateChanged,
    currentUser: null,
  },
  db: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.mockOnAuthStateChanged,
  signInWithEmailAndPassword: mocks.mockSignIn,
  createUserWithEmailAndPassword: mocks.mockCreateUser,
  signOut: mocks.mockSignOut,
  updateProfile: mocks.mockUpdateProfile,
}))

vi.mock('firebase/firestore', () => ({
  doc: mocks.mockDoc,
  setDoc: mocks.mockSetDoc,
  serverTimestamp: mocks.mockServerTimestamp,
}))

import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with loading true and user null', () => {
    const store = useAuthStore()
    expect(store.loading).toBe(true)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('resolves ready promise and sets loading false after init', async () => {
    mocks.mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(null)
      return vi.fn()
    })
    const store = useAuthStore()
    store.init()
    await store.ready
    expect(store.loading).toBe(false)
    expect(store.user).toBeNull()
  })

  it('calls setDoc with user profile after register', async () => {
    const fakeUser = { uid: 'u1' }
    mocks.mockCreateUser.mockResolvedValue({ user: fakeUser })
    mocks.mockUpdateProfile.mockResolvedValue()
    mocks.mockSetDoc.mockResolvedValue()

    const store = useAuthStore()
    await store.register('a@test.com', 'password1', 'Amara')

    expect(mocks.mockCreateUser).toHaveBeenCalledWith(expect.anything(), 'a@test.com', 'password1')
    expect(mocks.mockUpdateProfile).toHaveBeenCalledWith(fakeUser, { displayName: 'Amara' })
    expect(mocks.mockSetDoc).toHaveBeenCalledTimes(1)
  })

  it('signs out', async () => {
    mocks.mockSignOut.mockResolvedValue()
    const store = useAuthStore()
    await store.logout()
    expect(mocks.mockSignOut).toHaveBeenCalledTimes(1)
  })
})
