<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Menu, X } from '@lucide/vue'
import AppLogo from './AppLogo.vue'
import AppButton from './AppButton.vue'
import AppThemeToggle from './AppThemeToggle.vue'
import AppAvatar from './AppAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const mobileOpen = ref(false)
const isLanding = computed(() => route.name === 'Landing')
const displayName = computed(() => authStore.user?.displayName || authStore.user?.email || '')

function go(name) {
  mobileOpen.value = false
  router.push({ name })
}

function goSection(hash) {
  mobileOpen.value = false
  if (route.name === 'Landing') {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  } else {
    router.push({ name: 'Landing', hash })
  }
}
</script>

<template>
  <nav class="bg-card border-b border-line sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <button class="flex items-center gap-2 cursor-pointer" @click="go(authStore.user ? 'Dashboard' : 'Landing')">
          <AppLogo :size="30" />
        </button>

        <div class="hidden md:flex items-center gap-6">
          <button
            v-if="isLanding"
            class="text-sm font-medium text-fg-2 hover:text-fg cursor-pointer transition-colors"
            @click="goSection('#how-it-works')"
          >
            How it works
          </button>
          <button
            v-if="isLanding"
            class="text-sm font-medium text-fg-2 hover:text-fg cursor-pointer transition-colors"
            @click="goSection('#features')"
          >
            Features
          </button>
          <AppThemeToggle />

          <template v-if="authStore.user">
            <button
              class="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Profile"
              @click="go('Profile')"
            >
              <AppAvatar :name="displayName" :id="authStore.user?.uid" size="sm" />
            </button>
            <AppButton variant="primary" size="sm" @click="go('Dashboard')">Dashboard</AppButton>
          </template>
          <template v-else>
            <button
              class="text-sm font-medium text-fg-2 hover:text-fg cursor-pointer transition-colors"
              @click="go('Login')"
            >
              Log in
            </button>
            <AppButton variant="primary" size="sm" @click="go('Register')">Get started</AppButton>
          </template>
        </div>

        <div class="flex items-center gap-1 md:hidden">
          <AppThemeToggle />
          <button
            class="p-2 text-fg-2 cursor-pointer"
            aria-label="Toggle menu"
            title="Menu"
            @click="mobileOpen = !mobileOpen"
          >
            <Menu v-if="!mobileOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <div v-if="mobileOpen" class="md:hidden pb-4 border-t border-line pt-3 flex flex-col gap-1">
        <template v-if="isLanding">
          <button class="w-full text-left px-3 py-2 text-sm text-fg-2 hover:bg-line-subtle rounded-lg cursor-pointer" @click="goSection('#how-it-works')">How it works</button>
          <button class="w-full text-left px-3 py-2 text-sm text-fg-2 hover:bg-line-subtle rounded-lg cursor-pointer" @click="goSection('#features')">Features</button>
        </template>
        <template v-if="authStore.user">
          <button class="w-full text-left px-3 py-2 text-sm text-fg-2 hover:bg-line-subtle rounded-lg cursor-pointer" @click="go('Dashboard')">Dashboard</button>
          <button class="w-full text-left px-3 py-2 text-sm text-fg-2 hover:bg-line-subtle rounded-lg cursor-pointer" @click="go('Profile')">Profile</button>
        </template>
        <template v-else>
          <button class="w-full text-left px-3 py-2 text-sm text-fg-2 hover:bg-line-subtle rounded-lg cursor-pointer" @click="go('Login')">Log in</button>
          <AppButton variant="primary" block @click="go('Register')">Get started</AppButton>
        </template>
      </div>
    </div>
  </nav>
</template>
