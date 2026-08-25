import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth, db } from '@/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useGroupsStore } from '@/stores/groups'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const profileVersion = ref(0)

  let resolveReady = null
  const ready = new Promise((resolve) => {
    resolveReady = resolve
  })

  const isAuthenticated = computed(() => !!user.value)

  const displayName = computed(() => {
    void profileVersion.value
    return user.value?.displayName || ''
  })

  const email = computed(() => {
    void profileVersion.value
    return user.value?.email || ''
  })

  function init() {
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
      resolveReady()
    })
  }

  async function register(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName,
      email,
      createdAt: serverTimestamp(),
    })
    return cred.user
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function logout() {
    await signOut(auth)
    useGroupsStore().resetAll()
  }

  async function updateDisplayName(newName) {
    const trimmed = (newName || '').trim()
    if (!trimmed) throw new Error('Display name cannot be empty')
    if (trimmed.length > 60) throw new Error('Display name must be 60 characters or less')

    const current = auth.currentUser
    if (!current) throw new Error('You must be signed in to update your profile')

    await updateProfile(current, { displayName: trimmed })
    await setDoc(doc(db, 'users', current.uid), { displayName: trimmed }, { merge: true })
    await useGroupsStore().syncMemberDisplayName(current.uid, trimmed)

    user.value = current
    profileVersion.value += 1
  }

  async function sendPasswordReset(email) {
    await sendPasswordResetEmail(auth, email)
  }

  async function sendVerificationEmail() {
    const current = auth.currentUser
    if (!current) throw new Error('You must be signed in to verify your email')
    await sendEmailVerification(current)
  }

  async function refreshUser() {
    const current = auth.currentUser
    if (!current) return
    await reload(current)
    user.value = auth.currentUser
    profileVersion.value += 1
  }

  return {
    user,
    loading,
    ready,
    isAuthenticated,
    displayName,
    email,
    init,
    register,
    login,
    logout,
    updateDisplayName,
    sendPasswordReset,
    sendVerificationEmail,
    refreshUser,
  }
})
