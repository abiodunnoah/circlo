import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth } from '@/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  function init() {
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
    })
  }

  async function register(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    return cred.user
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, loading, isAuthenticated, init, register, login, logout }
})
