<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const steps = [
  { num: '01', title: 'Create a Group', text: 'Set up a savings group, define the contribution amount, and choose weekly or monthly cycles.' },
  { num: '02', title: 'Invite Members', text: 'Share the invite link with your group via WhatsApp or any channel. Approve members as they join.' },
  { num: '03', title: 'Save Together', text: 'Track contributions, see who received the pot, and export reports — all in one place.' },
]

const features = [
  { title: 'Digital Ledger', text: 'No more paper records or WhatsApp confusion. Every contribution and payout is recorded automatically.' },
  { title: 'Transparent Tracking', text: 'Members see who has paid, who has received, and who is next — no secrets, no disputes.' },
  { title: 'Rotation Management', text: 'Set the rotation order once. The system tracks who gets the pot each cycle.' },
  { title: 'Export Reports', text: 'Generate PDF reports per cycle or per group for your records.' },
]

function nav(route) {
  router.push({ name: route })
}
</script>

<template>
  <div>
    <section class="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
      <h1 class="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">Digital Savings Groups for Ajo &amp; Esusu</h1>
      <p class="text-lg text-muted max-w-2xl mx-auto mb-8">Circlo brings your traditional savings group online — transparent contribution tracking, rotation management, and reports, all in one place.</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button class="bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer w-full sm:w-auto" @click="nav('Register')">Get Started Free</button>
        <button class="bg-white text-slate-700 px-6 py-3 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer w-full sm:w-auto" @click="nav('Login')">Sign In</button>
      </div>
    </section>

    <section class="bg-white py-16 border-y border-slate-200">
      <div class="max-w-5xl mx-auto px-4">
        <h2 class="text-2xl font-bold text-center text-slate-900 mb-12">How It Works</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="(step, i) in steps" :key="i" class="text-center">
            <div class="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">{{ step.num }}</div>
            <h3 class="font-semibold text-slate-900 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-muted leading-relaxed">{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 max-w-5xl mx-auto px-4">
      <h2 class="text-2xl font-bold text-center text-slate-900 mb-12">Everything You Need</h2>
      <div class="grid sm:grid-cols-2 gap-6">
        <div v-for="(f, i) in features" :key="i" class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 class="font-semibold text-slate-900 mb-1">{{ f.title }}</h3>
          <p class="text-sm text-muted">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <footer class="border-t border-slate-200 py-8 text-center text-sm text-muted">
      <p>Circlo &mdash; Built by Noah</p>
    </footer>
  </div>
</template>
