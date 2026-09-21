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

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    await authStore.register(email.value, password.value, name.value)
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
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-fg text-center mb-1">Create your account</h1>
      <p class="text-sm text-muted text-center mb-6">Join Circlo and start saving together</p>

      <AppCard>
        <form class="space-y-4" @submit.prevent="handleRegister">
          <AppInput v-model="name" label="Full Name" type="text" required autocomplete="name" placeholder="Your name" />

          <AppInput v-model="email" label="Email" type="email" required autocomplete="email" placeholder="you@example.com" />

          <AppInput v-model="password" label="Password" :type="showPassword ? 'text' : 'password'" required autocomplete="new-password" placeholder="At least 6 characters" minlength="6">
            <template #trailing>
              <button type="button" class="p-2 text-fg-4 hover:text-fg-3 cursor-pointer rounded-lg" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide password' : 'Show password'">
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </template>
          </AppInput>

          <AppInput v-model="confirmPassword" label="Confirm Password" :type="showConfirmPassword ? 'text' : 'password'" required autocomplete="new-password" placeholder="Re-enter your password" minlength="6">
            <template #trailing>
              <button type="button" class="p-2 text-fg-4 hover:text-fg-3 cursor-pointer rounded-lg" @click="showConfirmPassword = !showConfirmPassword" :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'">
                <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </template>
          </AppInput>

          <p v-if="error" class="text-sm text-danger-600">{{ error }}</p>

          <AppButton type="submit" variant="primary" block :loading="loading">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </AppButton>
        </form>
      </AppCard>

      <p class="text-center text-sm text-muted mt-4">
        Already have an account?
        <button class="text-primary-600 font-medium hover:text-primary-700 py-1 -my-1 cursor-pointer" @click="router.push({ name: 'Login', query: route.query })">Sign in</button>
      </p>
    </div>
  </div>
</template>
