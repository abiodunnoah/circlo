<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useNotificationsStore } from '@/stores/notifications'
import AppNavbar from './AppNavbar.vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import AppMobileNav from './AppMobileNav.vue'
import AppToast from './AppToast.vue'

const route = useRoute()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const notificationsStore = useNotificationsStore()

const isApp = computed(() => !!authStore.user && route.meta.requiresAuth === true)
const isAdminOfAnyGroup = computed(() => groupsStore.groups.some((g) => g.role === 'admin'))

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
  <div v-if="isApp" class="min-h-screen flex bg-surface">
    <AppSidebar />
    <div class="flex-1 min-w-0 flex flex-col">
      <AppTopbar />
      <main class="flex-1 pb-24 lg:pb-0">
        <slot />
      </main>
    </div>
    <AppMobileNav />
  </div>

  <div v-else class="min-h-screen flex flex-col">
    <AppNavbar />
    <main class="flex-1">
      <slot />
    </main>
  </div>

  <AppToast />
</template>
