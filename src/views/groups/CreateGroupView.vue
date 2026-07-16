<script setup>
import { ref } from 'vue'

const name = ref('')
const amount = ref('')
const frequency = ref('weekly')
const startDate = ref('')
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Create a Group</h1>

    <form class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
        <input v-model="name" type="text" required placeholder="e.g. Family Savings" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Contribution Amount (₦)</label>
        <input v-model="amount" type="number" required placeholder="50000" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
        <div class="flex gap-2">
          <label class="flex-1 cursor-pointer">
            <input type="radio" v-model="frequency" value="weekly" class="sr-only peer" />
            <div class="text-center px-4 py-2 rounded-lg border text-sm font-medium peer-checked:bg-primary-50 peer-checked:border-primary-500 peer-checked:text-primary-700 border-slate-300 text-slate-700 hover:border-slate-400">Weekly</div>
          </label>
          <label class="flex-1 cursor-pointer">
            <input type="radio" v-model="frequency" value="monthly" class="sr-only peer" />
            <div class="text-center px-4 py-2 rounded-lg border text-sm font-medium peer-checked:bg-primary-50 peer-checked:border-primary-500 peer-checked:text-primary-700 border-slate-300 text-slate-700 hover:border-slate-400">Monthly</div>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
        <input v-model="startDate" type="date" required class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <button type="submit" class="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 cursor-pointer mt-2">Create Group</button>
    </form>
  </div>
</template>
