<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useContributionsStore } from '@/stores/contributions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import { formatNaira } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const contributionsStore = useContributionsStore()
const toast = useToast()

const resending = ref(false)

const needsVerification = computed(() => !!authStore.user && !authStore.user.emailVerified)

async function resendVerification() {
  resending.value = true
  try {
    await authStore.sendVerificationEmail()
    toast.show('Verification email sent', 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  } finally {
    resending.value = false
  }
}

async function checkVerification() {
  try {
    await authStore.refreshUser()
    if (authStore.user?.emailVerified) {
      toast.show('Email verified', 'success')
    } else {
      toast.show('Email not verified yet. Check your inbox.', 'info')
    }
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

const groups = computed(() => groupsStore.groups)

function openGroup(g) {
  if (g.membershipStatus === 'pending') {
    toast.show('Your request is awaiting admin approval', 'info')
    return
  }
  if (g.membershipStatus === 'rejected') {
    toast.show('Your request was declined by the admin', 'info')
    return
  }
  router.push({ name: 'GroupDetail', params: { id: g.id } })
}

const totalContributed = computed(() => contributionsStore.myTotalContributed)

const pendingCount = computed(() => {
  if (groupsStore.pendingRequests.length) return groupsStore.pendingRequests.length
  return groups.value.reduce((sum, g) => sum + (g.role === 'admin' ? g.pendingCount || 0 : 0), 0)
})

const isAdminOfAnyGroup = computed(() => groups.value.some((g) => g.role === 'admin'))

onMounted(() => {
  contributionsStore.fetchMyContributions()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Welcome back{{ authStore.user?.displayName ? ', ' + authStore.user.displayName.split(' ')[0] : '' }}</h1>

    <div v-if="needsVerification" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p class="text-sm font-medium text-amber-900 mb-0.5">Verify your email address</p>
        <p class="text-sm text-amber-800">Check your inbox for a verification link so you never miss an update.</p>
      </div>
      <div class="flex gap-2 shrink-0">
        <button class="text-sm font-medium text-amber-900 underline hover:text-amber-950 cursor-pointer disabled:opacity-50" :disabled="resending" @click="resendVerification">{{ resending ? 'Sending...' : 'Resend email' }}</button>
        <button class="bg-white border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-100 cursor-pointer" @click="checkVerification">I've verified</button>
      </div>
    </div>

    <div v-if="groupsStore.loading" aria-label="Loading..." aria-busy="true">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <AppSkeleton class="h-3 w-20 mb-2" />
          <AppSkeleton class="h-7 w-16" />
        </div>
      </div>
      <AppSkeleton class="h-5 w-28 mb-4" />
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div class="flex items-start justify-between mb-3">
            <AppSkeleton class="h-4 w-1/2" />
            <AppSkeleton class="h-5 w-12 rounded-full" />
          </div>
          <div class="space-y-2.5">
            <AppSkeleton class="h-3 w-full" />
            <AppSkeleton class="h-3 w-3/5" />
            <AppSkeleton class="h-3 w-2/3" />
            <AppSkeleton class="h-3 w-1/3" />
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <div v-if="groupsStore.error" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p class="text-sm font-medium text-red-800 mb-1">Couldn't load your groups</p>
        <p class="text-sm text-red-700 mb-2">{{ groupsStore.error }}</p>
        <button class="text-sm font-medium text-red-700 underline cursor-pointer" @click="groupsStore.unsubscribeUserGroups(); groupsStore.subscribeUserGroups()">Try again</button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AppCard>
          <p class="text-sm text-muted mb-1">Active Groups</p>
          <p class="text-2xl font-bold text-slate-900">{{ groups.length }}</p>
        </AppCard>
        <AppCard>
          <p class="text-sm text-muted mb-1">Total Contributed</p>
          <p class="text-2xl font-bold text-slate-900">{{ formatNaira(totalContributed) }}</p>
        </AppCard>
        <AppCard>
          <p class="text-sm text-muted mb-1">As Admin</p>
          <p class="text-2xl font-bold text-slate-900">{{ groups.filter((g) => g.role === 'admin').length }}</p>
        </AppCard>
        <AppCard>
          <button
            v-if="isAdminOfAnyGroup"
            class="w-full text-left cursor-pointer"
            @click="router.push({ name: 'Requests' })"
          >
            <p class="text-sm text-muted mb-1 flex items-center gap-1">
              Pending Requests
              <svg class="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </p>
            <p class="text-2xl font-bold text-slate-900">{{ pendingCount }}</p>
          </button>
          <template v-else>
            <p class="text-sm text-muted mb-1">Pending Requests</p>
            <p class="text-2xl font-bold text-slate-900">{{ pendingCount }}</p>
          </template>
        </AppCard>
      </div>

      <h2 class="text-lg font-semibold text-slate-900 mb-4">Your Groups</h2>

      <div v-if="groups.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="g in groups" :key="g.id" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer" @click="openGroup(g)">
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-semibold text-slate-900">{{ g.name }}</h3>
            <div class="flex gap-1.5">
              <span v-if="g.role === 'admin'" class="text-xs bg-accent-100 text-accent-700 rounded-full px-2 py-0.5 font-medium">Admin</span>
              <span v-if="g.membershipStatus === 'pending'" class="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 font-medium">Pending approval</span>
              <span v-else-if="g.membershipStatus === 'rejected'" class="text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5 font-medium">Declined</span>
              <span class="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium capitalize">{{ g.frequency }}</span>
            </div>
          </div>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">Contribution</span>
              <span class="font-medium">{{ formatNaira(g.contributionAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Cycle</span>
              <span class="font-medium">{{ g.currentCycle }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Next payout</span>
              <span class="font-medium">{{ g.nextRecipientName || '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Members</span>
              <span class="font-medium">{{ g.totalMembers }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <AppEmpty
          title="No groups yet"
          description="Create a savings group to get started, or join one with an invite link from an admin."
          action-label="Create your first group"
          @action="router.push({ name: 'CreateGroup' })"
        />
      </div>
    </template>
  </div>
</template>
