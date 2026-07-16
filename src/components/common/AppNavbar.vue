<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mobileOpen = ref(false)

function navigate(name) {
  mobileOpen.value = false
  router.push({ name })
}
</script>

<template>
  <nav class="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <button class="flex items-center gap-2 cursor-pointer" @click="navigate(authStore.user ? 'Dashboard' : 'Landing')">
          <span class="text-xl font-bold text-primary-700">Circlo</span>
        </button>

        <div v-if="authStore.user" class="hidden md:flex items-center gap-6">
          <button class="text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium" @click="navigate('Dashboard')">Dashboard</button>
          <button class="text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium" @click="navigate('GroupList')">Groups</button>
          <button class="text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium" @click="navigate('Notifications')">Notifications</button>
          <button class="text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium" @click="navigate('Profile')">Profile</button>
          <button class="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer" @click="navigate('Landing')">Logout</button>
        </div>

        <div v-else class="hidden md:flex items-center gap-3">
          <button class="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer" @click="navigate('Login')">Sign In</button>
          <button class="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 cursor-pointer" @click="navigate('Register')">Get Started</button>
        </div>

        <button class="md:hidden p-2 text-slate-600 cursor-pointer" @click="mobileOpen = !mobileOpen">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="mobileOpen" class="md:hidden pb-4 border-t border-slate-100 pt-3 flex flex-col gap-2">
        <template v-if="authStore.user">
          <button class="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer" @click="navigate('Dashboard')">Dashboard</button>
          <button class="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer" @click="navigate('GroupList')">Groups</button>
          <button class="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer" @click="navigate('Notifications')">Notifications</button>
          <button class="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer" @click="navigate('Profile')">Profile</button>
          <button class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" @click="navigate('Landing')">Logout</button>
        </template>
        <template v-else>
          <button class="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer" @click="navigate('Login')">Sign In</button>
          <button class="w-full text-left px-3 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg cursor-pointer" @click="navigate('Register')">Get Started</button>
        </template>
      </div>
    </div>
  </nav>
</template>
