<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goHome() {
  router.push({ name: authStore.user ? 'Dashboard' : 'Landing' })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
    <div class="text-center max-w-sm">
      <h1 class="text-6xl font-bold text-slate-200 mb-2">404</h1>
      <h2 class="text-xl font-semibold text-slate-900 mb-2">Page not found</h2>
      <p class="text-sm text-muted mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="goHome">Go Home</button>
    </div>
  </div>
</template>
