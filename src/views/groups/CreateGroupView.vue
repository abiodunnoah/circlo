<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppBackButton from '@/components/common/AppBackButton.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'

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
  <div class="max-w-xl mx-auto px-4 sm:px-6 py-8">
    <AppBackButton :fallback="{ name: 'GroupList' }" />
    <h1 class="text-2xl font-bold text-fg">Create a group</h1>
    <p class="text-sm text-muted mt-1 mb-6">Set up a savings circle and invite your members.</p>

    <AppCard>
      <form class="space-y-5" @submit.prevent="handleCreate">
        <AppInput
          v-model="name"
          label="Group name"
          type="text"
          required
          placeholder="e.g. Family Savings"
          hint="A name your members will recognise."
        />

        <AppInput
          v-model="amount"
          label="Contribution amount (₦)"
          type="number"
          inputmode="numeric"
          required
          min="100"
          placeholder="50000"
          hint="How much each member contributes per cycle."
        />

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
          <p class="mt-1.5 text-xs text-muted">How often members contribute.</p>
        </div>

        <AppInput
          v-model="startDate"
          label="Start date"
          type="date"
          required
          hint="When the first cycle begins."
        />

        <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

        <div class="flex gap-3">
          <AppButton
            type="button"
            variant="secondary"
            block
            @click="router.push({ name: 'GroupList' })"
          >
            Cancel
          </AppButton>
          <AppButton type="submit" variant="primary" block :loading="loading">
            {{ loading ? 'Creating...' : 'Create group' }}
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
