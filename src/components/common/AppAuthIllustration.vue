<script setup>
import { CheckCircle2 } from '@lucide/vue'

const orbit = [
  { pos: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2', color: 'bg-avatar-1-bg text-avatar-1-fg', done: true },
  { pos: 'left-[92%] top-[30%] -translate-x-1/2 -translate-y-1/2', color: 'bg-avatar-2-bg text-avatar-2-fg', done: true },
  { pos: 'left-[78%] top-[88%] -translate-x-1/2 -translate-y-1/2', color: 'bg-avatar-3-bg text-avatar-3-fg', done: false },
  { pos: 'left-[22%] top-[88%] -translate-x-1/2 -translate-y-1/2', color: 'bg-avatar-5-bg text-avatar-5-fg', done: false },
  { pos: 'left-[8%] top-[30%] -translate-x-1/2 -translate-y-1/2', color: 'bg-avatar-7-bg text-avatar-7-fg', done: false },
]
</script>

<template>
  <div class="relative mx-auto aspect-square w-full max-w-[15rem]" aria-hidden="true">
    <div class="absolute inset-0 rounded-full border-[10px] border-primary-200/70" />
    <div class="absolute inset-0 rounded-full border-[10px] border-primary-500 border-r-transparent border-b-transparent" />

    <div class="absolute inset-0 flex items-center justify-center">
      <div class="w-28 h-28 rounded-full bg-card ring-1 ring-line shadow-lg flex flex-col items-center justify-center">
        <span class="text-2xl font-bold text-fg tabular-nums">7/10</span>
        <span class="text-[11px] text-muted">members paid</span>
      </div>
    </div>

    <span
      v-for="(o, i) in orbit"
      :key="i"
      class="absolute w-11 h-11 rounded-full ring-4 ring-primary-50 flex items-center justify-center"
      :class="[o.pos, o.color]"
    >
      <CheckCircle2 v-if="o.done" class="w-5 h-5" />
      <span v-else class="w-2.5 h-2.5 rounded-full bg-current opacity-60" />
    </span>
  </div>
</template>
