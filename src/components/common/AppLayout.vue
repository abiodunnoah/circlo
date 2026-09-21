<script setup>
import { useAuthStore } from '@/stores/auth'
import AppNavbar from './AppNavbar.vue'
import AppToast from './AppToast.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNavbar />
    <main class="flex-1" :class="authStore.user ? 'pb-24 md:pb-0' : ''">
      <slot />
    </main>
    <AppToast />
  </div>
</template>
