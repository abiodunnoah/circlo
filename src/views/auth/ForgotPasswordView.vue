<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const error = ref('')
const sent = ref(false)
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await authStore.sendPasswordReset(email.value)
    sent.value = true
  } catch {
    error.value = 'Unable to send the reset link. Check the email address and try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-slate-900 text-center mb-1">Reset your password</h1>
      <p class="text-sm text-muted text-center mb-6">We'll email you a link to create a new password</p>

      <template v-if="!sent">
        <form class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input v-model="email" type="email" required autocomplete="email" placeholder="you@example.com" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>

          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <button type="submit" class="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer" :class="{ 'opacity-50': loading }">
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <p class="text-center text-sm text-muted mt-4">
          Remembered it?
          <button class="text-primary-600 font-medium hover:text-primary-700 cursor-pointer" @click="router.push({ name: 'Login' })">Back to sign in</button>
        </p>
      </template>

      <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="text-sm text-slate-900 font-medium mb-1">Check your inbox</p>
        <p class="text-sm text-muted mb-5">If an account exists for {{ email }}, a password reset link has been sent.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Login' })">Back to Sign In</button>
      </div>
    </div>
  </div>
</template>