<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Compass } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'

const router = useRouter()
const authStore = useAuthStore()
const homeName = computed(() => (authStore.user ? 'Dashboard' : 'Landing'))
const homeLabel = computed(() => (authStore.user ? 'Back to Dashboard' : 'Back to Home'))
</script>

<template>
  <div class="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-16 text-center">
    <div class="max-w-md">
      <div class="flex justify-center">
        <AppLogo :size="36" />
      </div>
      <div
        class="mt-8 w-16 h-16 mx-auto rounded-full bg-primary-50 text-primary-600 flex items-center justify-center"
      >
        <Compass class="w-8 h-8" />
      </div>
      <p class="mt-6 text-5xl font-bold text-fg">404</p>
      <h1 class="mt-2 text-2xl font-bold text-fg">Page not found</h1>
      <p class="mt-2 text-sm text-muted">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <AppButton variant="primary" @click="router.push({ name: homeName })">
          {{ homeLabel }}
        </AppButton>
        <AppButton variant="secondary" @click="router.push({ name: 'Landing' })">
          Go home
        </AppButton>
      </div>
    </div>
  </div>
</template>
