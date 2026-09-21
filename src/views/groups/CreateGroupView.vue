<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppBackButton from '@/components/common/AppBackButton.vue'
import AppAlert from '@/components/common/AppAlert.vue'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const toast = useToast()

const name = ref('')
const amount = ref('')
const frequency = ref('weekly')
const startDate = ref('')
const error = ref('')
const loading = ref(false)

async function handleCreate() {
  error.value = ''
  loading.value = true
  try {
    const groupId = await groupsStore.createGroup({
      name: name.value,
      amount: amount.value,
      frequency: frequency.value,
      startDate: startDate.value,
      adminId: authStore.user.uid,
      adminName: authStore.user.displayName || authStore.user.email,
      adminEmail: authStore.user.email,
    })
    toast.show('Group created successfully', 'success')
    router.push({ name: 'GroupDetail', params: { id: groupId } })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <AppBackButton :fallback="{ name: 'GroupList' }" />
    <h1 class="text-2xl font-bold text-fg mb-6">Create a Group</h1>

    <form class="bg-card rounded-xl border border-line shadow-sm p-5 space-y-4" @submit.prevent="handleCreate">
      <div>
        <label class="block text-sm font-medium text-fg-2 mb-1">Group Name</label>
        <input v-model="name" type="text" required placeholder="e.g. Family Savings" class="block w-full rounded-lg border border-line px-3 py-2 text-sm placeholder:text-fg-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-fg-2 mb-1">Contribution Amount (₦)</label>
        <input v-model="amount" type="number" required min="100" placeholder="50000" class="block w-full rounded-lg border border-line px-3 py-2 text-sm placeholder:text-fg-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-fg-2 mb-2">Frequency</label>
        <div class="flex gap-2">
          <label class="flex-1 cursor-pointer">
            <input type="radio" v-model="frequency" value="weekly" class="sr-only peer" />
            <div class="text-center px-4 py-2 rounded-lg border text-sm font-medium peer-checked:bg-primary-50 peer-checked:border-primary-500 peer-checked:text-primary-700 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 border-line text-fg-2 hover:border-fg-4">Weekly</div>
          </label>
          <label class="flex-1 cursor-pointer">
            <input type="radio" v-model="frequency" value="monthly" class="sr-only peer" />
            <div class="text-center px-4 py-2 rounded-lg border text-sm font-medium peer-checked:bg-primary-50 peer-checked:border-primary-500 peer-checked:text-primary-700 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 border-line text-fg-2 hover:border-fg-4">Monthly</div>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-fg-2 mb-1">Start Date</label>
        <input v-model="startDate" type="date" required class="block w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <button type="submit" class="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer" :class="{ 'opacity-50': loading }">
        {{ loading ? 'Creating...' : 'Create Group' }}
      </button>
    </form>
  </div>
</template>
