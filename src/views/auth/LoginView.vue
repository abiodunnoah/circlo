<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { Eye, EyeOff } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'

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
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-fg text-center mb-1">Welcome back</h1>
      <p class="text-sm text-muted text-center mb-6">Sign in to your Circlo account</p>

      <AppCard>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <AppInput v-model="email" label="Email" type="email" required autocomplete="email" placeholder="you@example.com" />

          <AppInput v-model="password" label="Password" :type="showPassword ? 'text' : 'password'" required autocomplete="current-password" placeholder="Enter your password">
            <template #trailing>
              <button type="button" class="p-2 text-fg-4 hover:text-fg-3 cursor-pointer rounded-lg" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide password' : 'Show password'">
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </template>
          </AppInput>

          <p v-if="error" class="text-sm text-danger-600">{{ error }}</p>

          <AppButton type="submit" variant="primary" block :loading="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </AppButton>
        </form>
      </AppCard>

      <p class="text-center text-sm text-muted mt-4">
        Forgot your password?
        <button class="text-primary-600 font-medium hover:text-primary-700 py-1 -my-1 cursor-pointer" @click="router.push({ name: 'ForgotPassword', query: route.query })">Reset it here</button>
      </p>

      <p class="text-center text-sm text-muted mt-2">
        Don't have an account?
        <button class="text-primary-600 font-medium hover:text-primary-700 py-1 -my-1 cursor-pointer" @click="router.push({ name: 'Register', query: route.query })">Create one</button>
      </p>
    </div>
  </div>
</template>
