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

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const inviteCode = route.query.invite

async function handleRegister() {
  error.value = ''

  if (!name.value.trim()) {
    error.value = 'Please enter your full name'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    await authStore.register(email.value, password.value, name.value.trim())
    try {
      await authStore.sendVerificationEmail()
    } catch {
      // Verification email is best-effort; the account is still created
    }
    if (inviteCode) {
      router.push({ name: 'Join', query: { invite: inviteCode } })
    } else {
      router.push({ name: 'Dashboard' })
    }
  } catch (e) {
    error.value = getAuthErrorMessage(e, 'Unable to create your account. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppAuthLayout title="Create your account" subtitle="Start saving together in minutes.">
    <p
      v-if="inviteCode"
      class="mb-4 text-sm text-primary-700 bg-primary-50 rounded-lg px-3 py-2"
    >
      You've been invited to join a savings group.
    </p>

    <form class="space-y-4" @submit.prevent="handleRegister">
      <AppInput
        v-model="name"
        label="Full name"
        required
        autocomplete="name"
        placeholder="e.g. Noah Adeyemi"
      />
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        required
        autocomplete="email"
        placeholder="you@example.com"
      />

      <AppInput
        v-model="password"
        label="Password"
        :type="showPassword ? 'text' : 'password'"
        required
        autocomplete="new-password"
        placeholder="At least 6 characters"
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

      <AppInput
        v-model="confirmPassword"
        label="Confirm password"
        :type="showConfirmPassword ? 'text' : 'password'"
        required
        autocomplete="new-password"
        placeholder="Re-enter your password"
      >
        <template #trailing>
          <button
            type="button"
            class="p-2 text-fg-4 hover:text-fg-3 cursor-pointer rounded-lg"
            :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
            <EyeOff v-else class="w-5 h-5" />
          </button>
        </template>
      </AppInput>

      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <AppButton type="submit" variant="primary" block :loading="loading">
        {{ loading ? 'Creating account...' : 'Create account' }}
      </AppButton>
    </form>

    <p class="text-center text-sm text-muted mt-6">
      Already have an account?
      <button
        class="text-primary-600 font-medium hover:text-primary-700 py-1 -my-1 cursor-pointer"
        @click="router.push({ name: 'Login', query: route.query })"
      >
        Sign in
      </button>
    </p>
  </AppAuthLayout>
</template>
