<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useNotificationsStore } from '@/stores/notifications'
import { useToast } from '@/composables/useToast'
import { LogOut, Sun } from '@lucide/vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppStatusBadge from '@/components/common/AppStatusBadge.vue'
import AppThemeToggle from '@/components/common/AppThemeToggle.vue'
import AppConfirm from '@/components/common/AppConfirm.vue'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const notificationsStore = useNotificationsStore()
const toast = useToast()

const nameInput = ref('')
const saving = ref(false)
const showLogout = ref(false)

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

async function confirmLogout() {
  showLogout.value = false
  groupsStore.unsubscribeUserGroups()
  notificationsStore.unsubscribeNotifications()
  await authStore.logout()
  router.push({ name: 'Landing' })
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
    <AppPageHeader title="Profile" subtitle="Manage your account and preferences." />

    <AppCard class="mb-6">
      <div class="flex items-center gap-4 mb-5">
        <AppAvatar :name="displayName || email" :id="authStore.user?.uid" size="xl" />
        <div class="min-w-0">
          <p class="font-semibold text-fg truncate">{{ displayName || 'Unnamed user' }}</p>
          <p class="text-sm text-muted truncate">{{ email }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-fg-2 mb-1">Display name</label>
          <div class="flex gap-2">
            <AppInput
              v-model="nameInput"
              type="text"
              maxlength="60"
              autocomplete="name"
              placeholder="Your name"
              class="flex-1"
              @keyup.enter="saveName"
            />
            <AppButton variant="primary" :disabled="!canSave" :loading="saving" @click="saveName">
              {{ saving ? 'Saving...' : 'Save' }}
            </AppButton>
          </div>
          <p class="text-xs text-muted mt-1">This is the name other members see in your groups.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-fg-2 mb-1">Email</label>
          <AppInput :model-value="email" type="email" disabled />
        </div>
      </div>
    </AppCard>

    <AppCard class="mb-6">
      <h2 class="font-semibold text-fg mb-1 flex items-center gap-2">
        <Sun class="w-4 h-4 text-fg-4" />
        Appearance
      </h2>
      <p class="text-sm text-muted mb-4">Choose how Circlo looks on this device.</p>
      <AppThemeToggle variant="segmented" />
    </AppCard>

    <AppCard class="mb-6">
      <h2 class="font-semibold text-fg mb-3">Your groups</h2>

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
    </AppCard>

    <AppCard>
      <h2 class="font-semibold text-fg mb-1">Sign out</h2>
      <p class="text-sm text-muted mb-4">Sign out of your Circlo account on this device.</p>
      <AppButton variant="outline-danger" @click="showLogout = true">
        <LogOut class="w-4 h-4" />
        Sign out
      </AppButton>
    </AppCard>

    <AppConfirm
      :open="showLogout"
      title="Sign out?"
      message="Are you sure you want to sign out of Circlo?"
      confirm-label="Sign out"
      variant="danger"
      @confirm="confirmLogout"
      @cancel="showLogout = false"
    />
  </div>
</template>
