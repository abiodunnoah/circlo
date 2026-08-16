<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import AppModal from '@/components/common/AppModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()

const mobileOpen = ref(false)
const showLogoutModal = ref(false)

const isAdminOfAnyGroup = computed(() => groupsStore.groups.some((g) => g.role === 'admin'))
const pendingRequestCount = computed(() => groupsStore.pendingRequests.length)

const navItems = computed(() => {
  const items = [
    { label: 'Dashboard', name: 'Dashboard', routeNames: ['Dashboard'] },
    { label: 'Groups', name: 'GroupList', routeNames: ['GroupList', 'GroupDetail', 'CreateGroup'] },
  ]
  if (isAdminOfAnyGroup.value) {
    items.push({
      label: 'Requests',
      name: 'Requests',
      routeNames: ['Requests'],
      badge: pendingRequestCount,
    })
  }
  items.push(
    { label: 'My Contributions', name: 'Contributions', routeNames: ['Contributions'] },
    { label: 'Notifications', name: 'Notifications', routeNames: ['Notifications'] },
    { label: 'Profile', name: 'Profile', routeNames: ['Profile'] },
  )
  return items
})

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

onMounted(() => {
  refreshRequestCount()
})
</script>

<template>
  <nav class="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <button class="flex items-center gap-2 cursor-pointer" @click="navigate(authStore.user ? 'Dashboard' : 'Landing')">
          <span class="text-xl font-bold text-primary-700">Circlo</span>
        </button>

        <div v-if="authStore.user" class="hidden md:flex items-center gap-6">
          <button
            v-for="item in navItems"
            :key="item.name"
            class="text-sm font-medium cursor-pointer transition-colors"
            :class="isActive(item) ? 'text-primary-700' : 'text-slate-600 hover:text-slate-900'"
            @click="navigate(item.name)"
          >
            <span class="flex items-center gap-1.5">
              {{ item.label }}
              <span
                v-if="item.badge && item.badge.value"
                class="bg-accent-500 text-white text-xs font-semibold rounded-full min-w-[1.25rem] px-1.5 py-0.5 leading-none"
              >
                {{ item.badge.value }}
              </span>
            </span>
            <span v-if="isActive(item)" class="block h-0.5 w-6 bg-primary-600 rounded-full mt-0.5 mx-auto" />
          </button>
          <button class="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer" @click="openLogoutModal">Logout</button>
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
          <button
            v-for="item in navItems"
            :key="item.name"
            class="w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between"
            :class="isActive(item) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50'"
            @click="navigate(item.name)"
          >
            <span>{{ item.label }}</span>
            <span
              v-if="item.badge && item.badge.value"
              class="bg-accent-500 text-white text-xs font-semibold rounded-full min-w-[1.25rem] px-1.5 py-0.5 leading-none"
            >
              {{ item.badge.value }}
            </span>
          </button>
          <button class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" @click="openLogoutModal">Logout</button>
        </template>
        <template v-else>
          <button class="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer" @click="navigate('Login')">Sign In</button>
          <button class="w-full text-left px-3 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg cursor-pointer" @click="navigate('Register')">Get Started</button>
        </template>
      </div>
    </div>
  </nav>

  <AppModal :open="showLogoutModal" title="Sign Out" size="sm" @close="showLogoutModal = false">
    <div class="flex flex-col items-center text-center">
      <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-3">
        <svg class="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </div>
      <p class="text-sm text-muted mb-5">Are you sure you want to sign out?</p>
      <div class="flex gap-3 w-full">
        <button class="flex-1 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer" @click="showLogoutModal = false">Cancel</button>
        <button class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer" @click="confirmLogout">Sign Out</button>
      </div>
    </div>
  </AppModal>
</template>
