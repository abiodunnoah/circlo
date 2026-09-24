<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { Eye, EyeOff } from '@lucide/vue'
import AppAuthLayout from '@/components/common/AppAuthLayout.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAlert from '@/components/common/AppAlert.vue'

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
  <AppAuthLayout title="Welcome back" subtitle="Sign in to continue managing your savings circles.">
    <p
      v-if="inviteCode"
      class="mb-4 text-sm text-primary-700 bg-primary-50 rounded-lg px-3 py-2"
    >
      You've been invited to join a savings group. Sign in to continue.
    </p>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        required
        autocomplete="email"
        placeholder="you@example.com"
      />

      <div>
        <AppInput
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          required
          autocomplete="current-password"
          placeholder="Enter your password"
        >
          <template #trailing>
            <button
              type="button"
              class="p-2 text-fg-4 hover:text-fg-3 cursor-pointer rounded-lg"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </template>
        </AppInput>
        <div class="mt-1.5 text-right">
          <button
            class="text-sm font-medium text-primary-600 hover:text-primary-700 py-1 -my-1 cursor-pointer"
            @click="router.push({ name: 'ForgotPassword', query: route.query })"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <AppButton type="submit" variant="primary" block :loading="loading">
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </AppButton>
    </form>

    <p class="text-center text-sm text-muted mt-6">
      Don't have an account?
      <button
        class="text-primary-600 font-medium hover:text-primary-700 py-1 -my-1 cursor-pointer"
        @click="router.push({ name: 'Register', query: route.query })"
      >
        Create one
      </button>
    </p>
  </AppAuthLayout>
</template>
