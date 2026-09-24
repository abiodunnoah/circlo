<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowRight,
  Users,
  Wallet,
  RefreshCw,
  ShieldCheck,
  Bell,
  BarChart3,
  CheckCircle2,
  UserPlus,
} from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import AppProgressRing from '@/components/common/AppProgressRing.vue'

const router = useRouter()
const authStore = useAuthStore()

const steps = [
  {
    icon: Users,
    title: 'Create your circle',
    text: 'Set up your Ajo or Esusu group with the contribution amount and frequency.',
  },
  {
    icon: UserPlus,
    title: 'Invite your members',
    text: 'Send each member a personal invite link. They join in one tap — no back and forth.',
  },
  {
    icon: RefreshCw,
    title: 'Track contributions and turns',
    text: 'Record payments, follow the payout order, and confirm each cycle.',
  },
]

const features = [
  { icon: Users, title: 'Group management', text: 'Organise members, slots and invites in one place.' },
  { icon: Wallet, title: 'Contribution tracking', text: 'Mark who has paid, who is owing, and keep a clean ledger.' },
  { icon: RefreshCw, title: 'Rotation tracking', text: 'See the full payout order and whose turn is next.' },
  { icon: ShieldCheck, title: 'Transparent records', text: 'Every contribution, void and payout is preserved for audit.' },
  { icon: Bell, title: 'Notifications', text: 'Members are told when they pay and when it’s their turn.' },
  { icon: BarChart3, title: 'Reports', text: 'Understand what happened financially and export to PDF.' },
]

const trust = [
  { icon: ShieldCheck, label: 'Transparent records' },
  { icon: Users, label: 'Built for Ajo & Esusu' },
  { icon: CheckCircle2, label: 'Free to start' },
]

const avatarColors = ['bg-avatar-1-bg', 'bg-avatar-2-bg', 'bg-avatar-3-bg', 'bg-avatar-5-bg']

function getStarted() {
  router.push({ name: authStore.user ? 'Dashboard' : 'Register' })
}

function goFeatures() {
  router.push({ name: 'Landing', hash: '#features' })
}
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50 to-surface dark:from-primary-50/30" />
      <div
        class="absolute -top-24 -right-24 -z-10 w-96 h-96 rounded-full bg-primary-100/60 blur-3xl dark:bg-primary-100/10"
        aria-hidden="true"
      />
      <div class="max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span class="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary-700 bg-primary-100 rounded-full px-3 py-1">
            DIGITAL AJO &amp; ESUSU
          </span>
          <h1 class="mt-5 text-4xl sm:text-5xl font-bold text-fg leading-tight">
            Save together.<br />Stay accountable.
          </h1>
          <p class="mt-5 text-base sm:text-lg text-fg-2 max-w-lg">
            Circlo makes Ajo and Esusu groups simple to manage. Track contributions, follow the
            payout order, and always know whose turn is next.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <AppButton size="lg" @click="getStarted">
              Get started
              <ArrowRight class="w-4 h-4" />
            </AppButton>
            <AppButton
              size="lg"
              variant="secondary"
              @click="router.push({ name: 'Landing', hash: '#how-it-works' })"
            >
              See how it works
            </AppButton>
          </div>

          <div class="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span v-for="(t, i) in trust" :key="i" class="inline-flex items-center gap-1.5">
              <component :is="t.icon" class="w-4 h-4 text-primary-600" />
              {{ t.label }}
            </span>
          </div>
        </div>

        <!-- Product preview -->
        <div class="relative">
          <div class="rounded-2xl border border-line bg-card shadow-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2 min-w-0">
                <AppLogo variant="mark" :size="22" />
                <p class="text-sm font-semibold text-fg truncate">Your circle</p>
              </div>
              <span class="text-xs font-semibold text-success-700 bg-success-100 rounded-full px-2.5 py-1">Active</span>
            </div>

            <div class="flex items-center gap-6">
              <AppProgressRing :value="6" :max="8" :size="104" :stroke="10" variant="primary">
                <span class="text-xl font-bold text-fg tabular-nums">6/8</span>
                <span class="text-[11px] text-muted">paid</span>
              </AppProgressRing>
              <div class="flex-1 min-w-0 space-y-3">
                <div>
                  <p class="text-[11px] text-muted">Current pot</p>
                  <p class="text-lg font-bold text-fg tabular-nums">₦200,000</p>
                </div>
                <div class="flex items-center">
                  <span
                    v-for="(c, i) in avatarColors"
                    :key="i"
                    class="w-8 h-8 rounded-full ring-2 ring-card -ml-2 first:ml-0"
                    :class="c"
                  />
                  <span class="w-8 h-8 rounded-full ring-2 ring-card -ml-2 bg-line text-[11px] font-semibold text-fg-2 flex items-center justify-center">+3</span>
                </div>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3 rounded-lg bg-line-subtle px-3 py-2.5">
              <div class="min-w-0">
                <p class="text-[11px] text-muted">Next recipient</p>
                <p class="text-sm font-semibold text-fg truncate">You</p>
              </div>
              <span class="text-[11px] font-medium text-primary-700 bg-primary-50 rounded-full px-2 py-0.5 shrink-0">Cycle 3 of 8</span>
            </div>
          </div>

          <div class="absolute -bottom-5 -left-5 hidden sm:block rounded-xl border border-line bg-card shadow-lg p-3">
            <p class="text-[11px] text-muted">Contribution</p>
            <p class="text-sm font-bold text-fg tabular-nums">₦25,000 <span class="font-normal text-muted">/ week</span></p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="bg-card py-16 border-y border-line">
      <div class="max-w-6xl mx-auto px-4">
        <p class="text-xs font-semibold tracking-wide text-primary-600 text-center mb-2">HOW IT WORKS</p>
        <h2 class="text-2xl sm:text-3xl font-bold text-center text-fg mb-12">Three steps to a healthier circle</h2>
        <div class="grid sm:grid-cols-3 gap-8">
          <div v-for="(s, i) in steps" :key="i" class="relative text-center sm:text-left">
            <div class="flex items-center gap-3 justify-center sm:justify-start mb-4">
              <span class="w-9 h-9 rounded-full bg-primary-600 text-inverse text-sm font-bold flex items-center justify-center shrink-0">
                {{ i + 1 }}
              </span>
              <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <component :is="s.icon" class="w-5 h-5" />
              </span>
            </div>
            <h3 class="font-semibold text-fg mb-1">{{ s.title }}</h3>
            <p class="text-sm text-muted">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-16 max-w-6xl mx-auto px-4">
      <p class="text-xs font-semibold tracking-wide text-primary-600 text-center mb-2">FEATURES</p>
      <h2 class="text-2xl sm:text-3xl font-bold text-center text-fg mb-12">
        Everything your circle needs
      </h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(f, i) in features"
          :key="i"
          class="rounded-xl border border-line bg-card p-5 shadow-sm"
        >
          <div class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
            <component :is="f.icon" class="w-5 h-5" />
          </div>
          <h3 class="font-semibold text-fg mb-1">{{ f.title }}</h3>
          <p class="text-sm text-muted">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="max-w-5xl mx-auto px-4 pb-20">
      <div class="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-inverse p-8 sm:p-12 text-center">
        <h2 class="text-2xl sm:text-3xl font-bold mb-3">
          Start managing your savings circle with Circlo.
        </h2>
        <p class="text-inverse/80 mb-6 max-w-xl mx-auto">
          Create a group in minutes — no spreadsheets, no guessing whose turn it is.
        </p>
        <div class="inline-flex">
          <AppButton size="lg" class="bg-card text-primary-700 hover:bg-line-subtle" @click="getStarted">
            Get started
            <ArrowRight class="w-4 h-4" />
          </AppButton>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-line bg-card">
      <div class="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <AppLogo :size="30" />
          <p class="mt-3 text-sm text-muted max-w-xs">
            Save Together. Grow Together. Digital savings circles for Nigeria.
          </p>
        </div>
        <div>
          <p class="text-sm font-semibold text-fg mb-3">Product</p>
          <ul class="space-y-2 text-sm text-muted">
            <li><button class="hover:text-fg py-1 cursor-pointer" @click="router.push({ name: 'Landing', hash: '#how-it-works' })">How it works</button></li>
            <li><button class="hover:text-fg py-1 cursor-pointer" @click="goFeatures">Features</button></li>
            <li><button class="hover:text-fg py-1 cursor-pointer" @click="getStarted">Get started</button></li>
          </ul>
        </div>
        <div>
          <p class="text-sm font-semibold text-fg mb-3">Account</p>
          <ul class="space-y-2 text-sm text-muted">
            <li><button class="hover:text-fg py-1 cursor-pointer" @click="router.push({ name: 'Login' })">Log in</button></li>
            <li><button class="hover:text-fg py-1 cursor-pointer" @click="router.push({ name: 'Register' })">Create account</button></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-line">
        <p class="max-w-6xl mx-auto px-4 py-4 text-xs text-muted">
          © {{ new Date().getFullYear() }} Circlo. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>
