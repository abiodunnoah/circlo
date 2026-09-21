<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const toast = useToast()

const nameInput = ref('')
const saving = ref(false)

const displayName = computed(() => authStore.displayName)
const email = computed(() => authStore.email)

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

function roleStatus(g) {
  if (g.role === 'admin') return 'active'
  if (g.membershipStatus === 'pending') return 'pending'
  if (g.membershipStatus === 'rejected') return 'rejected'
  return 'default'
}

function isClickable(g) {
  return g.membershipStatus === 'approved' || g.role === 'admin'
}

function openGroup(g) {
  if (!isClickable(g)) return
  router.push({ name: 'GroupDetail', params: { id: g.id } })
}

onMounted(() => {
  groupsStore.fetchUserGroups()
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-fg mb-6">Profile</h1>

    <div class="bg-card rounded-xl border border-line shadow-sm p-5 mb-6">
      <div class="flex items-center gap-4 mb-5">
        <AppAvatar :name="displayName || email" :id="authStore.user?.uid" size="xl" />
        <div class="min-w-0">
          <p class="font-semibold text-fg truncate">{{ displayName || 'Unnamed user' }}</p>
          <p class="text-sm text-muted truncate">{{ email }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-fg-2 mb-1">Display Name</label>
          <div class="flex gap-2">
            <input
              v-model="nameInput"
              type="text"
              maxlength="60"
              autocomplete="name"
              placeholder="Your name"
              class="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <label class="block text-sm font-medium text-fg-2 mb-1">Email</label>
          <input :value="email" type="email" disabled class="block w-full rounded-lg border border-line bg-line-subtle px-3 py-2 text-sm text-muted cursor-not-allowed" />
        </div>
      </div>
    </div>

    <div class="bg-card rounded-xl border border-line shadow-sm p-5">
      <h2 class="font-semibold text-fg mb-3">Your Groups</h2>

      <div v-if="groupsStore.loading" aria-label="Loading..." aria-busy="true" class="divide-y divide-line-subtle">
        <div v-for="i in 3" :key="i" class="flex items-center justify-between py-2.5">
          <AppSkeleton class="h-3.5 w-32" />
          <AppSkeleton class="h-5 w-14 rounded-full" />
        </div>
      </div>

      <div v-else-if="groupsStore.groups.length" class="divide-y divide-line-subtle">
        <div
          v-for="g in groupsStore.groups"
          :key="g.id"
          class="flex items-center justify-between py-2.5"
          :class="isClickable(g) ? 'cursor-pointer' : ''"
          :role="isClickable(g) ? 'button' : undefined"
          :tabindex="isClickable(g) ? 0 : undefined"
          @click="openGroup(g)"
          @keydown.enter="openGroup(g)"
          @keydown.space.prevent="openGroup(g)"
        >
          <span class="text-sm text-fg truncate pr-3">{{ g.name }}</span>
          <AppStatusBadge :status="roleStatus(g)" :label="roleLabel(g)" class="shrink-0" />
        </div>
      </div>

      <p v-else class="text-sm text-muted py-2">You're not part of any groups yet.</p>
    </div>
  </div>
</template>
