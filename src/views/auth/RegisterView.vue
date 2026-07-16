<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    // TODO: wire up Firebase auth in Phase 2
    console.log('Register', name.value, email.value, password.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-slate-900 text-center mb-1">Create your account</h1>
      <p class="text-sm text-muted text-center mb-6">Join Circlo and start saving together</p>

      <form class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input v-model="name" type="text" required placeholder="Your name" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input v-model="email" type="email" required placeholder="you@example.com" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input v-model="password" type="password" required placeholder="At least 6 characters" minlength="6" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button type="submit" class="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer" :class="{ 'opacity-50': loading }">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="text-center text-sm text-muted mt-4">
        Already have an account?
        <button class="text-primary-600 font-medium hover:text-primary-700 cursor-pointer" @click="router.push({ name: 'Login' })">Sign in</button>
      </p>
    </div>
  </div>
</template>
