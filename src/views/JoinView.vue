<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { Loader2, Lock, Clock, Users, CheckCircle2, AlertTriangle } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()

const inviteCode = route.query.invite || ''
const status = ref('loading')
const groupName = ref('')
const error = ref('')

onMounted(async () => {
  if (!inviteCode) {
    status.value = 'invalid'
    return
  }

  const group = await groupsStore.getGroupByInviteCode(inviteCode)
  if (!group) {
    status.value = 'invalid'
    return
  }
  groupName.value = group.name

  await authStore.ready

  if (!authStore.user) {
    status.value = 'auth_required'
    return
  }

  await submitJoin()
})

async function submitJoin() {
  try {
    const result = await groupsStore.joinGroupByInvite(
      inviteCode,
      authStore.user.uid,
      authStore.user.displayName || authStore.user.email,
      authStore.user.email,
    )
    status.value = result?.status === 'already_pending' ? 'already_requested' : 'requested'
  } catch (e) {
    if (e.message.includes('already a member')) {
      status.value = 'already_member'
    } else if (e.message.includes('mid-rotation')) {
      status.value = 'mid_rotation'
    } else {
      error.value = e.message
      status.value = 'error'
    }
  }
}

function goAuth(routeName) {
  router.push({ name: routeName, query: { invite: inviteCode } })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
    <div class="w-full max-w-md bg-card rounded-xl border border-line shadow-sm p-8 text-center">
      <template v-if="status === 'loading'">
        <Loader2 class="animate-spin h-8 w-8 text-primary-600 mx-auto" />
        <p class="mt-3 text-sm text-muted">Checking invite link...</p>
      </template>

      <template v-else-if="status === 'auth_required'">
        <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock class="w-6 h-6 text-accent-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Join {{ groupName || 'this group' }}</h1>
        <p class="text-sm text-muted mb-6">You need a Circlo account to join this savings group. Sign in or create one to continue.</p>
        <div class="flex flex-col gap-2">
          <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="goAuth('Register')">Create an Account</button>
          <button class="bg-card text-fg-2 px-4 py-2 rounded-lg text-sm font-medium border border-line hover:bg-line-subtle cursor-pointer" @click="goAuth('Login')">I Already Have an Account</button>
        </div>
      </template>

      <template v-else-if="status === 'requested'">
        <div class="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 class="w-6 h-6 text-success-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Join Request Sent!</h1>
        <p class="text-sm text-muted mb-6">Your request to join <span class="font-medium text-fg">{{ groupName }}</span> is pending. The group admin will approve it shortly.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Dashboard' })">Go to Dashboard</button>
      </template>

      <template v-else-if="status === 'already_requested'">
        <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock class="w-6 h-6 text-accent-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Request Already Sent</h1>
        <p class="text-sm text-muted mb-6">You've already requested to join <span class="font-medium text-fg">{{ groupName }}</span>. The group admin will review your request shortly.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Dashboard' })">Go to Dashboard</button>
      </template>

      <template v-else-if="status === 'already_member'">
        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users class="w-6 h-6 text-primary-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">You're Already a Member</h1>
        <p class="text-sm text-muted mb-6">You're already part of {{ groupName }}.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Dashboard' })">Go to Dashboard</button>
      </template>

      <template v-else-if="status === 'mid_rotation'">
        <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-6 h-6 text-accent-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Group Is Mid-Rotation</h1>
        <p class="text-sm text-muted mb-6">{{ groupName }} is currently mid-rotation. New members can join once every member has received the pot this rotation. Please check back later.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Dashboard' })">Go to Dashboard</button>
      </template>

      <template v-else-if="status === 'invalid'">
        <div class="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-6 h-6 text-danger-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Invalid Invite Link</h1>
        <p class="text-sm text-muted mb-6">This invite link doesn't exist or has expired. Please ask the group admin for a new link.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Landing' })">Go Home</button>
      </template>

      <template v-else>
        <div class="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-6 h-6 text-danger-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Something Went Wrong</h1>
        <p class="text-sm text-danger-600 mb-6">{{ error }}</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Landing' })">Go Home</button>
      </template>
    </div>
  </div>
</template>
