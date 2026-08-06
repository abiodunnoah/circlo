<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppLoader from '@/components/common/AppLoader.vue'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const toast = useToast()

const nameInput = ref('')
const saving = ref(false)

const displayName = computed(() => authStore.displayName)
const email = computed(() => authStore.email)

const initial = computed(() => {
  const source = displayName.value || email.value
  return source ? source.charAt(0).toUpperCase() : '?'
})

const isDirty = computed(() => nameInput.value.trim() !== displayName.value)
const canSave = computed(() => !saving.value && isDirty.value && nameInput.value.trim().length > 0)

watch(
  displayName,
  (value) => {
    if (!isDirty.value || !nameInput.value) nameInput.value = value
  },
  { immediate: true },
)

async function saveName() {
  if (!canSave.value) return
  saving.value = true
  try {
    await authStore.updateDisplayName(nameInput.value)
    await groupsStore.fetchUserGroups()
    toast.show('Profile updated', 'success')
  } catch (e) {
    toast.show(e.message, 'error')
  } finally {
    saving.value = false
  }
}

function roleLabel(g) {
  if (g.role === 'admin') return 'Admin'
  if (g.membershipStatus === 'pending') return 'Pending'
  if (g.membershipStatus === 'rejected') return 'Declined'
  return 'Member'
}

function roleClass(g) {
  if (g.role === 'admin') return 'bg-accent-100 text-accent-700'
  if (g.membershipStatus === 'pending') return 'bg-yellow-100 text-yellow-800'
  if (g.membershipStatus === 'rejected') return 'bg-red-100 text-red-800'
  return 'bg-slate-100 text-slate-600'
}

function openGroup(g) {
  if (g.membershipStatus === 'pending' || g.membershipStatus === 'rejected') return
  router.push({ name: 'GroupDetail', params: { id: g.id } })
}

onMounted(() => {
  groupsStore.fetchUserGroups()
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Profile</h1>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div class="flex items-center gap-4 mb-5">
        <div class="w-14 h-14 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold">
          {{ initial }}
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-slate-900 truncate">{{ displayName || 'Unnamed user' }}</p>
          <p class="text-sm text-muted truncate">{{ email }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
          <div class="flex gap-2">
            <input
              v-model="nameInput"
              type="text"
              maxlength="60"
              autocomplete="name"
              placeholder="Your name"
              class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              @keyup.enter="saveName"
            />
            <button
              class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canSave"
              @click="saveName"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
          <p class="text-xs text-muted mt-1">This is the name other members see in your groups.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input :value="email" type="email" disabled class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-muted cursor-not-allowed" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h2 class="font-semibold text-slate-900 mb-3">Your Groups</h2>

      <AppLoader v-if="groupsStore.loading" text="Loading groups..." />

      <div v-else-if="groupsStore.groups.length" class="divide-y divide-slate-100">
        <div
          v-for="g in groupsStore.groups"
          :key="g.id"
          class="flex items-center justify-between py-2.5"
          :class="g.membershipStatus === 'approved' || g.role === 'admin' ? 'cursor-pointer' : ''"
          @click="openGroup(g)"
        >
          <span class="text-sm text-slate-900 truncate pr-3">{{ g.name }}</span>
          <span class="text-xs rounded-full px-2 py-0.5 shrink-0" :class="roleClass(g)">{{ roleLabel(g) }}</span>
        </div>
      </div>

      <p v-else class="text-sm text-muted py-2">You're not part of any groups yet.</p>
    </div>
  </div>
</template>
