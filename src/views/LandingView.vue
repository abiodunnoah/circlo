<script setup>
import { useRouter } from 'vue-router'
import { ShieldCheck, Eye, Users, FileText, PiggyBank, CheckCircle2, ArrowRight } from '@lucide/vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'

const router = useRouter()

const steps = [
  {
    num: '01',
    title: 'Create a Group',
    text: 'Set up a savings group, define the contribution amount, and choose weekly or monthly cycles.',
  },
  {
    num: '02',
    title: 'Invite Members',
    text: 'Share the invite link with your group via WhatsApp or any channel. Approve members as they join.',
  },
  {
    num: '03',
    title: 'Save Together',
    text: 'Track contributions, see who received the pot, and export reports — all in one place.',
  },
]

const features = [
  {
    icon: Eye,
    title: 'Transparent Tracking',
    text: 'Members see who has paid, who has received, and who is next — no secrets, no disputes.',
  },
  {
    icon: Users,
    title: 'Clear Payout Order',
    text: 'Set the rotation once and arrange individual turns. Everyone sees the exact payout sequence.',
  },
  {
    icon: FileText,
    title: 'Export Reports',
    text: 'Generate PDF reports per cycle or per group for your records and accountability.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable Records',
    text: 'A permanent digital ledger replaces paper notes and chat threads. Every payment is recorded.',
  },
]

const mockPayouts = [
  { name: 'Ada Okafor', status: 'received' },
  { name: 'Bola Adeyemi', status: 'received' },
  { name: 'Chidi Nwosu', status: 'next' },
  { name: 'Damilola Bello', status: 'waiting' },
]

function nav(route) {
  router.push({ name: route })
}
</script>

<template>
  <div>
    <section class="max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-16">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div class="text-center lg:text-left">
          <span
            class="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full px-3 py-1 mb-4"
          >
            <PiggyBank class="w-3.5 h-3.5" />
            Built for Ajo, Esusu & ROSCAs
          </span>
          <h1 class="text-4xl sm:text-5xl font-bold text-fg leading-tight mb-4">
            Digital savings groups you can
            <span class="text-primary-700"> actually trust</span>
          </h1>
          <p class="text-lg text-muted max-w-xl mx-auto lg:mx-0 mb-8">
            Circlo brings your traditional savings group online — transparent contribution tracking, a
            clear payout order, and reports everyone can see. No more paper ledgers or WhatsApp disputes.
          </p>
          <div
            class="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
          >
            <button
              class="bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer w-full sm:w-auto"
              @click="nav('Register')"
            >
              Get Started Free
            </button>
            <button
              class="bg-card text-fg-2 px-6 py-3 rounded-lg text-sm font-medium border border-line hover:bg-line-subtle cursor-pointer w-full sm:w-auto"
              @click="nav('Login')"
            >
              Sign In
            </button>
          </div>
          <div
            class="flex items-center justify-center lg:justify-start gap-5 mt-6 text-xs text-muted"
          >
            <span class="flex items-center gap-1.5">
              <ShieldCheck class="w-4 h-4 text-primary-600" />
              Secure by design
            </span>
            <span class="flex items-center gap-1.5">
              <Eye class="w-4 h-4 text-primary-600" />
              Transparent payouts
            </span>
          </div>
        </div>

        <div class="hidden lg:block">
          <div class="relative">
            <div class="absolute -inset-4 bg-primary-100/50 rounded-3xl blur-2xl" aria-hidden="true" />
            <div class="relative bg-card rounded-2xl border border-line shadow-xl p-5 max-w-sm mx-auto">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-xs text-muted">Family Savings Circle</p>
                  <p class="text-sm font-semibold text-fg tabular-nums">₦500,000 pot</p>
                </div>
                <span class="text-xs bg-primary-100 text-primary-700 rounded-full px-2.5 py-0.5 font-medium">
                  Cycle 3 of 8
                </span>
              </div>
              <p class="text-xs font-medium text-muted mb-2">Payout order</p>
              <ul class="space-y-2">
                <li
                  v-for="p in mockPayouts"
                  :key="p.name"
                  class="flex items-center justify-between gap-2"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <AppAvatar :name="p.name" size="sm" />
                    <span class="text-sm text-fg truncate">{{ p.name }}</span>
                  </div>
                  <AppStatusBadge
                    :status="p.status === 'waiting' ? 'default' : p.status"
                    :label="p.status === 'waiting' ? 'Waiting' : ''"
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-card py-16 border-y border-line">
      <div class="max-w-5xl mx-auto px-4">
        <h2 class="text-2xl font-bold text-center text-fg mb-12">How It Works</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="(step, i) in steps" :key="i" class="text-center">
            <div
              class="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4"
            >
              {{ step.num }}
            </div>
            <h3 class="font-semibold text-fg mb-2">{{ step.title }}</h3>
            <p class="text-sm text-muted leading-relaxed">{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 max-w-5xl mx-auto px-4">
      <h2 class="text-2xl font-bold text-center text-fg mb-12">Everything You Need</h2>
      <div class="grid sm:grid-cols-2 gap-6">
        <div
          v-for="(f, i) in features"
          :key="i"
          class="bg-card rounded-xl border border-line p-5 shadow-sm"
        >
          <div
            class="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center mb-3"
          >
            <component :is="f.icon" class="w-5 h-5" />
          </div>
          <h3 class="font-semibold text-fg mb-1">{{ f.title }}</h3>
          <p class="text-sm text-muted">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <section class="max-w-5xl mx-auto px-4 pb-20">
      <div
        class="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8 sm:p-12 text-center"
      >
        <h2 class="text-2xl sm:text-3xl font-bold mb-3">Start your savings circle today</h2>
        <p class="text-primary-100 max-w-xl mx-auto mb-6">
          Create a group in minutes and invite your members with a single link.
        </p>
        <button
          class="inline-flex items-center gap-2 bg-card text-primary-700 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-primary-50 cursor-pointer"
          @click="nav('Register')"
        >
          Get Started Free
          <ArrowRight class="w-4 h-4" />
        </button>
        <div class="flex items-center justify-center gap-4 mt-6 text-xs text-primary-100">
          <span class="flex items-center gap-1.5">
            <CheckCircle2 class="w-4 h-4" />
            Free to use
          </span>
          <span class="flex items-center gap-1.5">
            <CheckCircle2 class="w-4 h-4" />
            No credit card
          </span>
        </div>
      </div>
    </section>

    <footer class="border-t border-line py-8 text-center text-sm text-muted">
      <p>Circlo &mdash; Built by Noah</p>
    </footer>
  </div>
</template>
