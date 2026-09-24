<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useNotificationsStore } from '@/stores/notifications'
import { useNav } from '@/composables/useNav'
import { LogOut } from '@lucide/vue'
import AppLogo from './AppLogo.vue'
import AppAvatar from './AppAvatar.vue'
import AppThemeToggle from './AppThemeToggle.vue'
import AppConfirm from './AppConfirm.vue'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const notificationsStore = useNotificationsStore()
const { sidebarItems, isActive, badgeValue } = useNav()

const showLogout = ref(false)

const displayName = computed(() => authStore.user?.displayName || '')
const email = computed(() => authStore.user?.email || '')

function go(name) {
  router.push({ name })
}

async function confirmLogout() {
  showLogout.value = false
  groupsStore.unsubscribeUserGroups()
  notificationsStore.unsubscribeNotifications()
  await authStore.logout()
  router.push({ name: 'Landing' })
}
</script>

<template>
  <aside
    class="hidden lg:flex lg:flex-col w-64 shrink-0 bg-card border-r border-line h-screen sticky top-0"
  >
    <div class="px-5 h-16 flex items-center border-b border-line">
      <button class="cursor-pointer" @click="go('Dashboard')">
        <AppLogo :size="30" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Primary">
      <button
        v-for="item in sidebarItems"
        :key="item.name"
        class="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
        :class="
          isActive(item)
            ? 'bg-primary-50 text-primary-700'
            : 'text-fg-2 hover:bg-line-subtle hover:text-fg'
        "
        :aria-current="isActive(item) ? 'page' : undefined"
        @click="go(item.name)"
      >
        <component
          :is="item.icon"
          class="w-5 h-5 shrink-0"
          :class="isActive(item) ? 'text-primary-600' : 'text-fg-4 group-hover:text-fg-3'"
        />
        <span class="flex-1 text-left truncate">{{ item.label }}</span>
        <span
          v-if="badgeValue(item)"
          class="min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-danger-500 text-[11px] font-semibold text-inverse leading-none text-center"
        >
          {{ badgeValue(item) }}
        </span>
      </button>
    </nav>

    <div class="border-t border-line p-3">
      <div class="flex items-center gap-3 px-1 py-1">
        <AppAvatar :name="displayName || email" :id="authStore.user?.uid" size="md" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-fg">{{ displayName || 'Member' }}</p>
          <p class="truncate text-xs text-muted">{{ email }}</p>
        </div>
      </div>
      <div class="mt-1 flex items-center gap-1">
        <AppThemeToggle />
        <button
          class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 cursor-pointer transition-colors"
          @click="showLogout = true"
        >
          <LogOut class="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  </aside>

  <AppConfirm
    :open="showLogout"
    title="Sign out?"
    message="Are you sure you want to sign out of Circlo?"
    confirm-label="Sign out"
    variant="danger"
    @confirm="confirmLogout"
    @cancel="showLogout = false"
  />
</template>
