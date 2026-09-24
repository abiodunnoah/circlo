import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

let authReadyPromise = null

function waitForAuthReady() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe()
        resolve()
      })
    })
  }
  return authReadyPromise
}

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue'),
    meta: { requiresAuth: false, title: 'Circlo' },
  },
  {
    path: '/join',
    name: 'Join',
    component: () => import('@/views/JoinView.vue'),
    meta: { requiresAuth: false, title: 'Join a group' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: 'Log in' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { requiresAuth: false, title: 'Reset password' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false, title: 'Create account' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
  },
  {
    path: '/groups',
    name: 'GroupList',
    component: () => import('@/views/groups/GroupListView.vue'),
    meta: { requiresAuth: true, title: 'My Groups' },
  },
  {
    path: '/groups/create',
    name: 'CreateGroup',
    component: () => import('@/views/groups/CreateGroupView.vue'),
    meta: { requiresAuth: true, title: 'Create group' },
  },
  {
    path: '/groups/:id',
    name: 'GroupDetail',
    component: () => import('@/views/groups/GroupDetailView.vue'),
    meta: { requiresAuth: true, title: 'Group' },
  },
  {
    path: '/rotation',
    name: 'Rotation',
    component: () => import('@/views/rotation/RotationView.vue'),
    meta: { requiresAuth: true, title: 'Rotation' },
  },
  {
    path: '/requests',
    name: 'Requests',
    component: () => import('@/views/requests/RequestsView.vue'),
    meta: { requiresAuth: true, title: 'Join requests' },
  },
  {
    path: '/contributions',
    name: 'Contributions',
    component: () => import('@/views/contributions/ContributionsView.vue'),
    meta: { requiresAuth: true, title: 'Contributions' },
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/notifications/NotificationsView.vue'),
    meta: { requiresAuth: true, title: 'Notifications' },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/reports/ReportsView.vue'),
    meta: { requiresAuth: true, title: 'Reports' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Profile' },
  },
  {
    path: '/404',
    name: 'NotFound404',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, title: 'Page not found' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, title: 'Page not found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  await waitForAuthReady()
  const requiresAuth = to.meta.requiresAuth
  const user = auth.currentUser

  if (requiresAuth && !user) {
    return { name: 'Landing' }
  }

  if (!requiresAuth && user && (to.name === 'Landing' || to.name === 'Login' || to.name === 'Register')) {
    if (to.query.invite) return { name: 'Join', query: { invite: to.query.invite } }
    return { name: 'Dashboard' }
  }

  return true
})

export default router
