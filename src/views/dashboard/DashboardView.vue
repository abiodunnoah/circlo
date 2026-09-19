<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  Wallet,
  ShieldCheck,
  Clock,
  ChevronRight,
  AlertTriangle,
  PiggyBank,
} from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useContributionsStore } from '@/stores/contributions'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppStat from '@/components/common/AppStat.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
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

function retryLoadGroups() {
  groupsStore.unsubscribeUserGroups()
  groupsStore.subscribeUserGroups()
}

const totalContributed = computed(() => contributionsStore.myTotalContributed)

const pendingCount = computed(() => {
  if (groupsStore.pendingRequests.length) return groupsStore.pendingRequests.length
  return groups.value.reduce((sum, g) => sum + (g.role === 'admin' ? g.pendingCount || 0 : 0), 0)
})

const isAdminOfAnyGroup = computed(() => groups.value.some((g) => g.role === 'admin'))

const activeGroups = computed(() =>
  groups.value.filter((g) => g.membershipStatus === 'approved' && g.currentCycle > 0),
)

const nextPayout = computed(() => {
  const candidates = activeGroups.value.filter((g) => g.currentCycleRecipientId)
  if (!candidates.length) return null
  const mine = candidates.find((g) => g.currentCycleRecipientId === authStore.user?.uid)
  const g = mine || candidates[0]
  return {
    group: g,
    isMe: g.currentCycleRecipientId === authStore.user?.uid,
    recipientName: g.nextRecipientName || 'A member',
    pot: (Number(g.contributionAmount) || 0) * (g.totalSlots || 1),
  }
})

function cycleLabel(g) {
  return `Cycle ${g.currentCycle} of ${g.totalSlots || 1}`
}

onMounted(() => {
  contributionsStore.fetchMyContributions()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <h1 class="text-2xl font-bold text-fg mb-6">
      Hi{{ authStore.user?.displayName ? ', ' + authStore.user.displayName.split(' ')[0] : '' }}
    </h1>

    <div
      v-if="needsVerification"
      class="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-warning-800 mb-0.5">Verify your email address</p>
          <p class="text-sm text-warning-700">
            Check your inbox for a verification link so you never miss an update.
          </p>
        </div>
      </div>
      <div class="flex gap-2 shrink-0">
        <button
          class="text-sm font-medium text-warning-800 underline hover:text-warning-900 cursor-pointer disabled:opacity-50"
          :disabled="resending"
          @click="resendVerification"
        >
          {{ resending ? 'Sending...' : 'Resend email' }}
        </button>
        <button
          class="bg-card border border-warning-300 text-warning-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-warning-100 cursor-pointer"
          @click="checkVerification"
        >
          I've verified
        </button>
      </div>
    </div>

    <div v-if="groupsStore.loading" aria-label="Loading..." aria-busy="true">
      <AppSkeleton class="h-32 w-full rounded-2xl mb-6" />
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="i in 4" :key="i" class="bg-card rounded-xl border border-line shadow-sm p-5">
          <AppSkeleton class="h-3 w-20 mb-2" />
          <AppSkeleton class="h-7 w-16" />
        </div>
      </div>
      <AppSkeleton class="h-5 w-28 mb-4" />
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="bg-card rounded-xl border border-line shadow-sm p-5">
          <div class="flex items-start justify-between mb-3">
            <AppSkeleton class="h-4 w-1/2" />
            <AppSkeleton class="h-5 w-12 rounded-full" />
          </div>
          <AppSkeleton class="h-2 w-full rounded-full mb-4" />
          <div class="space-y-2.5">
            <AppSkeleton class="h-3 w-full" />
            <AppSkeleton class="h-3 w-3/5" />
            <AppSkeleton class="h-3 w-2/3" />
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <div
        v-if="groupsStore.error"
        class="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-6"
      >
        <p class="text-sm font-medium text-danger-800 mb-1">Couldn't load your groups</p>
        <p class="text-sm text-danger-700 mb-2">{{ groupsStore.error }}</p>
        <button
          class="text-sm font-medium text-danger-700 underline cursor-pointer"
          @click="retryLoadGroups"
        >
          Try again
        </button>
      </div>

      <section
        v-if="nextPayout"
        class="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 to-primary-800 text-white p-6 mb-6"
      >
        <div
          class="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div class="relative">
          <div class="flex items-center gap-2 text-primary-100 text-sm font-medium">
            <PiggyBank class="w-4 h-4" />
            <span>{{ nextPayout.isMe ? "You're up next" : 'Next payout' }}</span>
          </div>
          <p class="text-3xl sm:text-4xl font-bold mt-2 tabular-nums">
            {{ formatNaira(nextPayout.pot) }}
          </p>
          <p class="text-sm text-primary-100 mt-1.5">
            <template v-if="nextPayout.isMe">
              You'll receive the pot in
              <span class="font-medium text-white">{{ nextPayout.group.name }}</span>
            </template>
            <template v-else>
              <span class="font-medium text-white">{{ nextPayout.recipientName }}</span> receives
              the pot in
              {{ nextPayout.group.name }}
            </template>
          </p>
          <button
            class="mt-4 inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-medium px-3.5 py-2 rounded-lg cursor-pointer"
            @click="openGroup(nextPayout.group)"
          >
            View group
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </section>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AppStat label="Active Groups" :value="groups.length" :icon="Users" variant="primary" />
        <AppStat
          label="Total Contributed"
          :value="formatNaira(totalContributed)"
          :icon="Wallet"
          variant="success"
        />
        <AppStat
          label="As Admin"
          :value="groups.filter((g) => g.role === 'admin').length"
          :icon="ShieldCheck"
          variant="accent"
        />
        <AppStat
          label="Pending Requests"
          :value="pendingCount"
          :icon="Clock"
          variant="info"
          :interactive="isAdminOfAnyGroup"
          @click="isAdminOfAnyGroup && router.push({ name: 'Requests' })"
        />
      </div>

      <h2 class="text-lg font-semibold text-fg mb-4">Your Groups</h2>

      <div v-if="groups.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="g in groups"
          :key="g.id"
          class="bg-card rounded-xl border border-line shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          @click="openGroup(g)"
        >
          <div class="flex items-start justify-between gap-2 mb-3">
            <h3 class="font-semibold text-fg truncate">{{ g.name }}</h3>
            <div class="flex flex-wrap justify-end gap-1.5 shrink-0">
              <span
                v-if="g.role === 'admin'"
                class="text-xs bg-accent-100 text-accent-700 rounded-full px-2 py-0.5 font-medium"
                >Admin</span
              >
              <AppStatusBadge
                v-if="g.membershipStatus === 'pending'"
                status="pending"
                label="Pending"
              />
              <AppStatusBadge
                v-else-if="g.membershipStatus === 'rejected'"
                status="rejected"
                label="Declined"
              />
              <span
                class="text-xs bg-success-100 text-success-700 rounded-full px-2 py-0.5 font-medium capitalize"
                >{{ g.frequency }}</span
              >
            </div>
          </div>

          <AppProgress
            :value="g.currentCycle"
            :max="g.totalSlots || 1"
            :label="cycleLabel(g)"
            class="mb-4"
          />

          <div class="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <p class="text-xs text-muted">Contribution</p>
              <p class="font-semibold text-fg tabular-nums">
                {{ formatNaira(g.contributionAmount) }}
              </p>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-muted">Next payout</p>
              <p class="font-semibold text-fg truncate">{{ g.nextRecipientName || '—' }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between mt-auto pt-3 border-t border-line">
            <div class="flex items-center gap-1.5 text-xs text-muted">
              <Users class="w-3.5 h-3.5" />
              {{ g.totalMembers }} {{ g.totalMembers === 1 ? 'member' : 'members' }}
            </div>
            <ChevronRight class="w-4 h-4 text-muted" />
          </div>
        </div>
      </div>

      <div v-else class="bg-card rounded-xl border border-line shadow-sm">
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
