<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { Eye, EyeOff } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const inviteCode = route.query.invite

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    if (inviteCode) {
      router.push({ name: 'Join', query: { invite: inviteCode } })
    } else {
      router.push({ name: 'Dashboard' })
    }
  } catch (e) {
    error.value = getAuthErrorMessage(e, 'Unable to sign in. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-fg text-center mb-1">Welcome back</h1>
      <p class="text-sm text-muted text-center mb-6">Sign in to your Circlo account</p>

      <form class="bg-card rounded-xl border border-line shadow-sm p-5 space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-fg-2 mb-1">Email</label>
          <input v-model="email" type="email" required autocomplete="email" placeholder="you@example.com" class="block w-full rounded-lg border border-line px-3 py-2 text-sm placeholder:text-fg-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-fg-2 mb-1">Password</label>
          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" required autocomplete="current-password" placeholder="Enter your password" class="block w-full rounded-lg border border-line px-3 py-2 pr-10 text-sm placeholder:text-fg-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-fg-4 hover:text-fg-3 cursor-pointer" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide password' : 'Show password'">
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <p v-if="error" class="text-sm text-danger-600">{{ error }}</p>

        <button type="submit" class="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer" :class="{ 'opacity-50': loading }">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="text-center text-sm text-muted mt-4">
        Forgot your password?
        <button class="text-primary-600 font-medium hover:text-primary-700 cursor-pointer" @click="router.push({ name: 'ForgotPassword', query: route.query })">Reset it here</button>
      </p>

      <p class="text-center text-sm text-muted mt-2">
        Don't have an account?
        <button class="text-primary-600 font-medium hover:text-primary-700 cursor-pointer" @click="router.push({ name: 'Register', query: route.query })">Create one</button>
      </p>
    </div>
  </div>
</template>
