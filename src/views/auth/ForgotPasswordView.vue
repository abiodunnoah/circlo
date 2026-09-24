<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Check } from '@lucide/vue'
import AppAuthLayout from '@/components/common/AppAuthLayout.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppAlert from '@/components/common/AppAlert.vue'

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
  <AppAuthLayout
    title="Reset your password"
    subtitle="We'll email you a link to create a new password."
  >
    <template v-if="!sent">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <AppInput
          v-model="email"
          label="Email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
        />

        <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

        <AppButton type="submit" variant="primary" block :loading="loading">
          {{ loading ? 'Sending...' : 'Send reset link' }}
        </AppButton>
      </form>

      <p class="text-center text-sm text-muted mt-6">
        Remembered it?
        <button
          class="text-primary-600 font-medium hover:text-primary-700 py-1 -my-1 cursor-pointer"
          @click="router.push({ name: 'Login' })"
        >
          Back to sign in
        </button>
      </p>
    </template>

    <div v-else class="text-center">
      <div class="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check class="w-6 h-6 text-success-600" />
      </div>
      <p class="text-sm text-fg font-medium mb-1">Check your inbox</p>
      <p class="text-sm text-muted mb-5 break-words">
        If an account exists for {{ email }}, a password reset link has been sent.
      </p>
      <AppButton variant="primary" @click="router.push({ name: 'Login' })">Back to Sign In</AppButton>
    </div>
  </AppAuthLayout>
</template>
