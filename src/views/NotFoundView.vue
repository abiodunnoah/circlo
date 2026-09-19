<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Compass } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

function goHome() {
  router.push({ name: authStore.user ? 'Dashboard' : 'Landing' })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
    <div class="text-center max-w-sm">
      <div class="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-5">
        <Compass class="w-10 h-10" />
      </div>
      <h1 class="text-5xl font-bold text-fg mb-2">404</h1>
      <h2 class="text-lg font-semibold text-fg mb-2">Page not found</h2>
      <p class="text-sm text-muted mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="goHome">Go Home</button>
    </div>
  </div>
</template>
