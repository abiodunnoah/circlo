<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  Wallet,
  Clock,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  RefreshCw,
  Bell,
} from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useContributionsStore } from '@/stores/contributions'
import { useNotificationsStore } from '@/stores/notifications'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppStat from '@/components/common/AppStat.vue'
import AppProgressRing from '@/components/common/AppProgressRing.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppMoney from '@/components/common/AppMoney.vue'
import AppAvatarGroup from '@/components/common/AppAvatarGroup.vue'
import { formatNaira } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const contributionsStore = useContributionsStore()
const notificationsStore = useNotificationsStore()
const toast = useToast()

const resending = ref(false)

const needsVerification = computed(() => !!authStore.user && !authStore.user.emailVerified)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})
const firstName = computed(() => (authStore.displayName || '').trim().split(/\s+/)[0] || 'there')

const groups = computed(() => groupsStore.groups)
const totalContributed = computed(() => contributionsStore.myTotalContributed)

const activeGroups = computed(() =>
  groups.value.filter((g) => g.membershipStatus === 'approved' && g.currentCycle > 0),
)

function nextPayoutDate(g) {
  const raw = g.currentCycleStartDate || g.startDate
  const base = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null
  if (!base || isNaN(base.getTime())) return null
  const d = new Date(base)
  if (g.frequency === 'weekly') d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  return d
}

function daysUntil(date) {
  if (!date) return null
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

const nextPayout = computed(() => {
  let best = null
  for (const g of activeGroups.value) {
    const date = nextPayoutDate(g)
    if (!date) continue
    if (!best || date < best.date) best = { group: g, date }
  }
  if (!best) return null
  const days = daysUntil(best.date)
  return {
    group: best.group,
    label:
      days === null
        ? '—'
        : days <= 0
          ? 'Due now'
          : days === 1
            ? 'Tomorrow'
            : `in ${days} days`,
    recipient: best.group.nextRecipientName || 'A member',
  }
})

const paidTotals = computed(() => {
  let paid = 0
  let eligible = 0
  for (const g of activeGroups.value) {
    paid += g.paidCount || 0
    eligible += g.eligibleCount || 0
  }
  return { paid, eligible }
})

const recentActivity = computed(() => notificationsStore.notifications.slice(0, 5))

const activityIcon = {
  paid: CheckCircle2,
  your_turn: Wallet,
  new_cycle: RefreshCw,
  approved: UserPlus,
  reminder: Bell,
}

function activityIconFor(type) {
  return activityIcon[type] || Bell
}

function timeAgo(ts) {
  const ms = ts?.toMillis ? ts.toMillis() : ts ? new Date(ts).getTime() : 0
  if (!ms) return ''
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ms).toLocaleDateString()
}

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
    if (authStore.user?.emailVerified) toast.show('Email verified', 'success')
    else toast.show('Email not verified yet. Check your inbox.', 'info')
  } catch (e) {
    toast.show(e.message, 'error')
  }
}

onMounted(() => {
  contributionsStore.fetchMyContributions()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-fg">
          {{ greeting }}, {{ firstName }}
          <span aria-hidden="true">👋</span>
        </h1>
        <p class="text-sm text-muted mt-1">Here's what's happening in your circles.</p>
      </div>
    </div>

    <AppAlert
      v-if="needsVerification"
      variant="info"
      title="Verify your email address"
      class="mb-6"
    >
      <p>Check your inbox for a verification link so you never miss an update.</p>
      <div class="mt-3 flex gap-2">
        <button
          class="text-sm font-medium text-info-800 underline hover:text-info-900 py-1.5 -my-1.5 cursor-pointer disabled:opacity-50"
          :disabled="resending"
          @click="resendVerification"
        >
          {{ resending ? 'Sending...' : 'Resend email' }}
        </button>
        <button
          class="bg-card border border-info-300 text-info-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-info-100 cursor-pointer"
          @click="checkVerification"
        >
          I've verified
        </button>
      </div>
    </AppAlert>

    <AppAlert
      v-if="groupsStore.error && !groupsStore.loading"
      variant="danger"
      title="Unable to load your groups"
      action-label="Try again"
      class="mb-6"
      @action="retryLoadGroups"
    >
      {{ groupsStore.error }}
    </AppAlert>

    <template v-if="groupsStore.loading">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AppCard v-for="i in 4" :key="i"><AppSkeleton class="h-4 w-20 mb-3" /><AppSkeleton class="h-7 w-24" /></AppCard>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AppCard v-for="i in 3" :key="i">
          <AppSkeleton class="h-5 w-32 mb-3" />
          <AppSkeleton class="h-3 w-24 mb-4" />
          <AppSkeleton class="h-2 w-full mb-4" />
          <AppSkeleton class="h-8 w-28" />
        </AppCard>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AppStat label="Total contributed" :value="formatNaira(totalContributed)" :icon="Wallet" variant="primary" />
        <AppStat
          label="Active groups"
          :value="activeGroups.length"
          :hint="`${groups.length} total`"
          :icon="Users"
          variant="info"
        />
        <AppStat
          label="Next payout"
          :value="nextPayout ? nextPayout.label : '—'"
          :hint="nextPayout ? nextPayout.group.name : 'No active cycle'"
          :icon="Clock"
          variant="accent"
        />
        <AppStat
          label="Members paid"
          :value="`${paidTotals.paid}/${paidTotals.eligible}`"
          hint="This cycle"
          :icon="CheckCircle2"
          variant="success"
        />
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-fg">Your groups</h2>
        <button
          class="text-sm font-medium text-primary-600 hover:text-primary-700 py-1.5 -my-1.5 cursor-pointer"
          @click="router.push({ name: 'GroupList' })"
        >
          View all
        </button>
      </div>

      <div v-if="groups.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <AppCard
          v-for="g in groups"
          :key="g.id"
          hover
          role="button"
          tabindex="0"
          class="cursor-pointer flex flex-col"
          @click="openGroup(g)"
          @keydown.enter="openGroup(g)"
          @keydown.space.prevent="openGroup(g)"
        >
          <div class="flex items-start justify-between gap-2 mb-3">
            <h3 class="font-semibold text-fg truncate min-w-0 flex-1">{{ g.name }}</h3>
            <div class="flex flex-wrap justify-end gap-1.5 shrink-0">
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
              <AppStatusBadge v-else status="active" label="Active" />
            </div>
          </div>

          <p class="text-sm text-muted mb-4">
            <AppMoney :value="g.contributionAmount" size="md" class="text-fg" /> / {{ g.frequency }}
          </p>

          <div class="flex items-center gap-4 mb-4">
            <AppProgressRing
              :value="g.paidCount || 0"
              :max="g.eligibleCount || (g.totalSlots || g.totalMembers || 1)"
              :size="76"
              :stroke="8"
            >
              <span class="text-sm font-bold text-fg tabular-nums"
                >{{ g.paidCount || 0 }}/{{ g.eligibleCount || g.totalSlots || g.totalMembers || 0 }}</span
              >
            </AppProgressRing>
            <div class="min-w-0 flex-1 space-y-2">
              <div>
                <p class="text-xs text-muted">Current pot</p>
                <AppMoney :value="g.currentPot" size="lg" />
              </div>
              <AppAvatarGroup v-if="g.memberSample?.length" :members="g.memberSample" :max="4" />
            </div>
          </div>

          <div class="mt-auto pt-3 border-t border-line flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs text-muted">Next recipient</p>
              <p class="text-sm font-medium text-fg truncate">{{ g.nextRecipientName || '—' }}</p>
            </div>
            <ChevronRight class="w-4 h-4 text-muted shrink-0" />
          </div>
        </AppCard>
      </div>

      <AppCard v-else padding="p-0" class="mb-8">
        <AppEmpty
          title="No groups yet"
          description="Create your first savings circle or join one using an invite link."
          action-label="Create group"
          @action="router.push({ name: 'CreateGroup' })"
        />
      </AppCard>

      <template v-if="recentActivity.length">
        <h2 class="text-lg font-semibold text-fg mb-4">Recent activity</h2>
        <AppCard padding="p-0">
          <ul class="divide-y divide-line-subtle">
            <li v-for="n in recentActivity" :key="n.id" class="flex items-start gap-3 px-5 py-3.5">
              <span
                class="w-8 h-8 rounded-full bg-line-subtle text-fg-3 flex items-center justify-center shrink-0"
              >
                <component :is="activityIconFor(n.type)" class="w-4 h-4" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-fg break-words">{{ n.message }}</p>
                <p class="text-xs text-muted mt-0.5">{{ timeAgo(n.createdAt) }}</p>
              </div>
            </li>
          </ul>
        </AppCard>
      </template>
    </template>
  </div>
</template>
