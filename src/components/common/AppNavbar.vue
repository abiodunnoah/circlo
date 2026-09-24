<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useNotificationsStore } from '@/stores/notifications'
import { useTheme } from '@/composables/useTheme'
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  Wallet,
  Bell,
  User,
  Inbox,
  BarChart3,
  Sun,
  Moon,
} from '@lucide/vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const notificationsStore = useNotificationsStore()
const { theme, toggleTheme } = useTheme()

const mobileOpen = ref(false)
const showLogoutModal = ref(false)

const isAdminOfAnyGroup = computed(() => groupsStore.groups.some((g) => g.role === 'admin'))
const pendingRequestCount = computed(() => groupsStore.pendingRequests.length)
const unreadCount = computed(() => notificationsStore.unreadCount)

const primaryItems = computed(() => [
  { label: 'Dashboard', name: 'Dashboard', routeNames: ['Dashboard'], icon: LayoutDashboard },
  { label: 'Groups', name: 'GroupList', routeNames: ['GroupList', 'GroupDetail', 'CreateGroup'], icon: Users },
  { label: 'Contributions', name: 'Contributions', routeNames: ['Contributions'], icon: Wallet },
  {
    label: 'Alerts',
    name: 'Notifications',
    routeNames: ['Notifications'],
    icon: Bell,
    badge: unreadCount,
  },
  { label: 'Profile', name: 'Profile', routeNames: ['Profile'], icon: User },
])

const extraItems = computed(() => {
  const items = []
  if (isAdminOfAnyGroup.value) {
    items.push({
      label: 'Join Requests',
      name: 'Requests',
      routeNames: ['Requests'],
      icon: Inbox,
      badge: pendingRequestCount,
    })
    items.push({ label: 'Reports', name: 'Reports', routeNames: ['Reports'], icon: BarChart3 })
  }
  return items
})

const allItems = computed(() => [...primaryItems.value, ...extraItems.value])

function isActive(item) {
  return item.routeNames.includes(route.name)
}

function navigate(name) {
  mobileOpen.value = false
  router.push({ name })
}

function openLogoutModal() {
  mobileOpen.value = false
  showLogoutModal.value = true
}

async function confirmLogout() {
  showLogoutModal.value = false
  groupsStore.unsubscribeUserGroups()
  notificationsStore.unsubscribeNotifications()
  await authStore.logout()
  router.push({ name: 'Landing' })
}

function refreshRequestCount() {
  if (authStore.user && isAdminOfAnyGroup.value && route.name !== 'Requests') {
    groupsStore.fetchPendingRequests()
  }
}

watch(isAdminOfAnyGroup, (value) => {
  if (value) refreshRequestCount()
})

watch(
  () => authStore.user?.uid,
  (uid, prevUid) => {
    if (uid && uid !== prevUid) {
      groupsStore.subscribeUserGroups()
      notificationsStore.subscribeNotifications()
    } else if (!uid) {
      groupsStore.unsubscribeUserGroups()
      notificationsStore.unsubscribeNotifications()
    }
  },
)

onMounted(() => {
  if (authStore.user) {
    groupsStore.subscribeUserGroups()
    notificationsStore.subscribeNotifications()
  }
  refreshRequestCount()
})

onUnmounted(() => {
  groupsStore.unsubscribeUserGroups()
  notificationsStore.unsubscribeNotifications()
})
</script>

<template>
  <nav class="bg-card border-b border-line sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <button class="flex items-center gap-2 cursor-pointer" @click="navigate(authStore.user ? 'Dashboard' : 'Landing')">
          <AppLogo :size="30" />
        </button>

        <div v-if="authStore.user" class="hidden md:flex items-center gap-5">
          <button
            v-for="item in allItems"
            :key="item.name"
            class="text-sm font-medium cursor-pointer transition-colors"
            :class="isActive(item) ? 'text-primary-700' : 'text-fg-3 hover:text-fg'"
            @click="navigate(item.name)"
          >
            <span class="flex items-center gap-1.5">
              {{ item.label }}
              <span
                v-if="item.badge && item.badge.value"
                class="bg-accent-500 text-inverse text-xs font-semibold rounded-full min-w-[1.25rem] px-1.5 py-0.5 leading-none"
              >
                {{ item.badge.value }}
              </span>
            </span>
            <span v-if="isActive(item)" class="block h-0.5 w-6 bg-primary-600 rounded-full mt-0.5 mx-auto" />
          </button>
          <button
            class="p-2.5 text-fg-4 hover:text-fg rounded-lg cursor-pointer transition-colors"
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'dark'" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>
          <button
            class="p-1.5 cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Profile"
            @click="navigate('Profile')"
          >
            <AppAvatar
              :name="authStore.user?.displayName || authStore.user?.email"
              :id="authStore.user?.uid"
              size="sm"
            />
          </button>
          <button class="text-sm font-medium text-danger-600 hover:text-danger-700 cursor-pointer" @click="openLogoutModal">Logout</button>
        </div>

        <div v-else class="hidden md:flex items-center gap-3">
          <button
            class="p-2.5 text-fg-4 hover:text-fg rounded-lg cursor-pointer transition-colors"
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'dark'" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>
          <button class="text-sm font-medium text-fg-3 hover:text-fg cursor-pointer" @click="navigate('Login')">Sign In</button>
          <AppButton variant="primary" @click="navigate('Register')">Get Started</AppButton>
        </div>

        <div class="flex items-center gap-1 md:hidden">
          <button
            class="p-2.5 text-fg-4 hover:text-fg rounded-lg cursor-pointer transition-colors"
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'dark'" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>
          <button
            v-if="authStore.user"
            class="p-2.5 text-fg-3 cursor-pointer"
            aria-label="Toggle menu"
            @click="mobileOpen = !mobileOpen"
          >
            <Menu v-if="!mobileOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <div v-if="mobileOpen" class="md:hidden pb-4 border-t border-line pt-3 flex flex-col gap-1">
        <template v-if="authStore.user">
          <button
            v-for="item in extraItems"
            :key="item.name"
            class="w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between"
            :class="isActive(item) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-fg-3 hover:bg-line-subtle'"
            @click="navigate(item.name)"
          >
            <span class="flex items-center gap-2">
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.label }}
            </span>
            <span
              v-if="item.badge && item.badge.value"
              class="bg-accent-500 text-inverse text-xs font-semibold rounded-full min-w-[1.25rem] px-1.5 py-0.5 leading-none"
            >
              {{ item.badge.value }}
            </span>
          </button>
          <button class="w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg cursor-pointer flex items-center gap-2" @click="openLogoutModal">
            <LogOut class="w-4 h-4" />
            Logout
          </button>
        </template>
        <template v-else>
          <button class="w-full text-left px-3 py-2 text-sm text-fg-3 hover:bg-line-subtle rounded-lg cursor-pointer" @click="navigate('Login')">Sign In</button>
          <button class="w-full text-left px-3 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg cursor-pointer" @click="navigate('Register')">Get Started</button>
        </template>
      </div>
    </div>
  </nav>

  <nav
    v-if="authStore.user"
    class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-line"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Primary"
  >
    <div class="flex items-stretch">
      <button
        v-for="item in primaryItems"
        :key="item.name"
        class="relative flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[11px] font-medium cursor-pointer"
        :class="isActive(item) ? 'text-primary-700' : 'text-fg-4'"
        :aria-current="isActive(item) ? 'page' : undefined"
        @click="navigate(item.name)"
      >
        <span v-if="isActive(item)" class="absolute top-0 h-0.5 w-8 bg-primary-600 rounded-full" aria-hidden="true" />
        <span class="relative mt-0.5">
          <component :is="item.icon" class="w-5 h-5" :stroke-width="isActive(item) ? 2.4 : 2" />
          <span
            v-if="item.badge && item.badge.value"
            class="absolute -top-1 -right-2 bg-accent-500 text-inverse text-[10px] font-semibold rounded-full min-w-[1rem] h-4 px-1 flex items-center justify-center leading-none"
          >
            {{ item.badge.value }}
          </span>
        </span>
        <span class="w-full truncate text-center">{{ item.label }}</span>
      </button>
    </div>
  </nav>

  <AppModal :open="showLogoutModal" title="Sign Out" size="sm" @close="showLogoutModal = false">
    <div class="flex flex-col items-center text-center">
      <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-3">
        <LogOut class="w-6 h-6 text-accent-600" />
      </div>
      <p class="text-sm text-muted mb-5">Are you sure you want to sign out?</p>
      <div class="flex gap-3 w-full">
        <AppButton variant="secondary" block @click="showLogoutModal = false">Cancel</AppButton>
        <AppButton variant="danger" block @click="confirmLogout">Sign Out</AppButton>
      </div>
    </div>
  </AppModal>
</template>
