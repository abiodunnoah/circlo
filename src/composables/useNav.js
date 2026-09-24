import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { useNotificationsStore } from '@/stores/notifications'
import {
  LayoutDashboard,
  Users,
  Wallet,
  RefreshCw,
  BarChart3,
  Bell,
  User,
} from '@lucide/vue'

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', name: 'Dashboard', routeNames: ['Dashboard'], icon: LayoutDashboard },
  {
    label: 'My Groups',
    name: 'GroupList',
    routeNames: ['GroupList', 'GroupDetail', 'CreateGroup'],
    icon: Users,
  },
  { label: 'Contributions', name: 'Contributions', routeNames: ['Contributions'], icon: Wallet },
  { label: 'Rotation', name: 'Rotation', routeNames: ['Rotation'], icon: RefreshCw },
  { label: 'Reports', name: 'Reports', routeNames: ['Reports'], icon: BarChart3 },
  {
    label: 'Notifications',
    name: 'Notifications',
    routeNames: ['Notifications'],
    icon: Bell,
    badge: 'unread',
  },
  { label: 'Profile', name: 'Profile', routeNames: ['Profile'], icon: User },
]

const BOTTOM_ITEMS = [
  { label: 'Home', name: 'Dashboard', routeNames: ['Dashboard'], icon: LayoutDashboard },
  {
    label: 'Groups',
    name: 'GroupList',
    routeNames: ['GroupList', 'GroupDetail', 'CreateGroup'],
    icon: Users,
  },
  { label: 'Contributions', name: 'Contributions', routeNames: ['Contributions'], icon: Wallet },
  {
    label: 'Alerts',
    name: 'Notifications',
    routeNames: ['Notifications'],
    icon: Bell,
    badge: 'unread',
  },
  { label: 'Profile', name: 'Profile', routeNames: ['Profile'], icon: User },
]

export function useNav() {
  const route = useRoute()
  const groupsStore = useGroupsStore()
  const notificationsStore = useNotificationsStore()

  const unreadCount = computed(() => notificationsStore.unreadCount)
  const pendingRequestCount = computed(() => groupsStore.pendingRequests.length)
  const isAdminOfAnyGroup = computed(() => groupsStore.groups.some((g) => g.role === 'admin'))

  function badgeValue(item) {
    if (item.badge === 'unread') return unreadCount.value
    return 0
  }

  function isActive(item) {
    return item.routeNames.includes(route.name)
  }

  return {
    sidebarItems: SIDEBAR_ITEMS,
    bottomItems: BOTTOM_ITEMS,
    unreadCount,
    pendingRequestCount,
    isAdminOfAnyGroup,
    badgeValue,
    isActive,
  }
}
