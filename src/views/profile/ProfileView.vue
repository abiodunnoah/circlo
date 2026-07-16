<script setup>
import { ref } from 'vue'

const displayName = ref('Chidi Nwosu')
const email = ref('chidi@example.com')
const saved = ref(false)

function saveName() {
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}

const groups = [
  { name: 'Market Women Ajo', role: 'Member' },
  { name: 'Family Savings', role: 'Member' },
  { name: 'Church Group', role: 'Admin' },
]
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Profile</h1>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div class="flex items-center gap-4 mb-5">
        <div class="w-14 h-14 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold">
          {{ displayName.charAt(0) }}
        </div>
        <div>
          <p class="font-semibold text-slate-900">{{ displayName }}</p>
          <p class="text-sm text-muted">{{ email }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
          <div class="flex gap-2">
            <input v-model="displayName" type="text" class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="saveName">Save</button>
          </div>
          <p v-if="saved" class="text-sm text-green-600 mt-1">Name updated</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input :value="email" type="email" disabled class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-muted cursor-not-allowed" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h2 class="font-semibold text-slate-900 mb-3">Your Groups</h2>
      <div class="divide-y divide-slate-100">
        <div v-for="g in groups" :key="g.name" class="flex items-center justify-between py-2.5">
          <span class="text-sm text-slate-900">{{ g.name }}</span>
          <span class="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{{ g.role }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
