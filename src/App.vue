<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/common/AppLayout.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.init()
})
</script>

<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>
