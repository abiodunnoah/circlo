import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups',
    name: 'GroupList',
    component: () => import('@/views/groups/GroupListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups/create',
    name: 'CreateGroup',
    component: () => import('@/views/groups/CreateGroupView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups/:id',
    name: 'GroupDetail',
    component: () => import('@/views/groups/GroupDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contributions',
    name: 'Contributions',
    component: () => import('@/views/contributions/ContributionsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/notifications/NotificationsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/reports/ReportsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const user = auth.currentUser

  if (requiresAuth && !user) {
    next({ name: 'Landing' })
  } else if (!requiresAuth && user && to.name === 'Landing') {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
