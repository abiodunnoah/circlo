<script setup>
import AppLogo from './AppLogo.vue'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="min-h-[calc(100dvh-4rem)] grid lg:grid-cols-2">
    <div
      class="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-600 to-primary-800 text-inverse"
    >
      <AppLogo :size="32" tone="inverse" />
      <div class="max-w-sm">
        <h2 class="text-3xl font-bold leading-tight">Stronger circles, bigger dreams.</h2>
        <p class="mt-4 text-sm text-inverse/80">
          Manage Ajo and Esusu groups with confidence — track contributions, follow the payout
          order, and always know whose turn is next.
        </p>
        <ul class="mt-8 space-y-3 text-sm text-inverse/90">
          <li class="flex items-center gap-2.5">
            <span class="w-1.5 h-1.5 rounded-full bg-inverse" />Transparent contribution records
          </li>
          <li class="flex items-center gap-2.5">
            <span class="w-1.5 h-1.5 rounded-full bg-inverse" />Clear rotation &amp; payout order
          </li>
          <li class="flex items-center gap-2.5">
            <span class="w-1.5 h-1.5 rounded-full bg-inverse" />Built for Nigerian savings circles
          </li>
        </ul>
      </div>
      <p class="text-xs text-inverse/70">© {{ new Date().getFullYear() }} Circlo</p>
    </div>

    <div class="flex items-center justify-center px-4 py-10 sm:px-8">
      <div class="w-full max-w-sm">
        <div class="mb-6 lg:hidden flex justify-center">
          <AppLogo :size="32" />
        </div>
        <h1 class="text-2xl font-bold text-fg mb-1">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-muted mb-6">{{ subtitle }}</p>
        <slot />
      </div>
    </div>
  </div>
</template>
