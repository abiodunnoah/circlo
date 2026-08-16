<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'

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
    await groupsStore.joinGroupByInvite(
      inviteCode,
      authStore.user.uid,
      authStore.user.displayName || authStore.user.email,
      authStore.user.email,
    )
    status.value = 'requested'
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
    <div class="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
      <template v-if="status === 'loading'">
        <svg class="animate-spin h-8 w-8 text-primary-600 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="mt-3 text-sm text-muted">Checking invite link...</p>
      </template>

      <template v-else-if="status === 'auth_required'">
        <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 9a2 2 0 10-4 0v4m4-4v4m0 0a2 2 0 11-4 0m-6-6a9 9 0 1112 14H7a9 9 0 01-6-8z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-1">Join {{ groupName || 'this group' }}</h1>
        <p class="text-sm text-muted mb-6">You need a Circlo account to join this savings group. Sign in or create one to continue.</p>
        <div class="flex flex-col gap-2">
          <button class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="goAuth('Register')">Create an Account</button>
          <button class="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer" @click="goAuth('Login')">I Already Have an Account</button>
        </div>
      </template>

      <template v-else-if="status === 'requested'">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-1">Join Request Sent!</h1>
        <p class="text-sm text-muted mb-6">Your request to join <span class="font-medium text-slate-900">{{ groupName }}</span> is pending. The group admin will approve it shortly.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Dashboard' })">Go to Dashboard</button>
      </template>

      <template v-else-if="status === 'already_member'">
        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-1">You're Already a Member</h1>
        <p class="text-sm text-muted mb-6">You're already part of {{ groupName }}.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Dashboard' })">Go to Dashboard</button>
      </template>

      <template v-else-if="status === 'mid_rotation'">
        <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-1">Group Is Mid-Rotation</h1>
        <p class="text-sm text-muted mb-6">{{ groupName }} is currently mid-rotation. New members can join once every member has received the pot this rotation. Please check back later.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Dashboard' })">Go to Dashboard</button>
      </template>

      <template v-else-if="status === 'invalid'">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-1">Invalid Invite Link</h1>
        <p class="text-sm text-muted mb-6">This invite link doesn't exist or has expired. Please ask the group admin for a new link.</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Landing' })">Go Home</button>
      </template>

      <template v-else>
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-1">Something Went Wrong</h1>
        <p class="text-sm text-red-600 mb-6">{{ error }}</p>
        <button class="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer" @click="router.push({ name: 'Landing' })">Go Home</button>
      </template>
    </div>
  </div>
</template>
