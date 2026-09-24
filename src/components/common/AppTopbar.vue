<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNav } from '@/composables/useNav'
import { Plus, Bell, Inbox } from '@lucide/vue'
import AppLogo from './AppLogo.vue'
import AppAvatar from './AppAvatar.vue'
import AppIconButton from './AppIconButton.vue'
import AppThemeToggle from './AppThemeToggle.vue'
import AppButton from './AppButton.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { unreadCount, pendingRequestCount, isAdminOfAnyGroup } = useNav()

const title = computed(() => route.meta.title || '')
const displayName = computed(() => authStore.user?.displayName || authStore.user?.email || '')
</script>

<template>
  <header class="sticky top-0 z-20 bg-card/90 backdrop-blur border-b border-line">
    <div class="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <button
          class="lg:hidden cursor-pointer"
          aria-label="Circlo home"
          @click="router.push({ name: 'Dashboard' })"
        >
          <AppLogo :size="28" />
        </button>
        <h1 class="hidden lg:block text-lg font-semibold text-fg truncate">{{ title }}</h1>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-2">
        <span class="hidden sm:block">
          <AppButton variant="primary" size="sm" @click="router.push({ name: 'CreateGroup' })">
            <Plus class="w-4 h-4" />
            New group
          </AppButton>
        </span>

        <span v-if="isAdminOfAnyGroup">
          <AppIconButton
            :badge="pendingRequestCount"
            label="Join requests"
            @click="router.push({ name: 'Requests' })"
          >
            <Inbox class="w-5 h-5" />
          </AppIconButton>
        </span>

        <span class="hidden lg:block">
          <AppIconButton
            :badge="unreadCount"
            label="Notifications"
            @click="router.push({ name: 'Notifications' })"
          >
            <Bell class="w-5 h-5" />
          </AppIconButton>
        </span>

        <span class="lg:hidden">
          <AppThemeToggle />
        </span>

        <button
          class="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Profile"
          title="Profile"
          @click="router.push({ name: 'Profile' })"
        >
          <AppAvatar :name="displayName" :id="authStore.user?.uid" size="sm" />
        </button>
      </div>
    </div>
  </header>
</template>
