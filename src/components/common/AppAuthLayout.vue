<script setup>
import { CheckCircle2 } from '@lucide/vue'
import AppLogo from './AppLogo.vue'
import AppAuthIllustration from './AppAuthIllustration.vue'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

const points = [
  'Transparent contribution records',
  'Clear rotation & payout order',
  'Built for Nigerian savings circles',
]
</script>

<template>
  <div class="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-10 sm:py-16">
    <div
      class="w-full max-w-4xl grid lg:grid-cols-2 rounded-2xl border border-line bg-card shadow-xl overflow-hidden"
    >
      <!-- Form -->
      <div class="p-6 sm:p-10">
        <div class="mb-6 lg:hidden flex justify-center">
          <AppLogo :size="32" />
        </div>
        <h1 class="text-2xl font-bold text-fg mb-1">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-muted mb-6">{{ subtitle }}</p>
        <slot />
      </div>

      <!-- Branding -->
      <div
        class="hidden lg:flex flex-col justify-between gap-8 bg-primary-50 p-10 border-l border-line"
      >
        <AppLogo :size="30" />
        <AppAuthIllustration />
        <div>
          <h2 class="text-xl font-bold text-fg">Stronger circles, bigger dreams.</h2>
          <ul class="mt-4 space-y-2.5 text-sm text-fg-2">
            <li v-for="(p, i) in points" :key="i" class="flex items-center gap-2.5">
              <CheckCircle2 class="w-4 h-4 text-primary-600 shrink-0" />
              {{ p }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
