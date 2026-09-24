<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { Loader2, Lock, Clock, Users, CheckCircle2, AlertTriangle } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()

const inviteCode = route.query.invite || ''
const status = ref('loading')
const groupName = ref('')
const joinedGroupId = ref('')
const error = ref('')

onMounted(async () => {
  if (!inviteCode) {
    status.value = 'invalid'
    return
  }

  const invite = await groupsStore.getGroupByInviteCode(inviteCode)
  if (!invite) {
    status.value = 'invalid'
    return
  }
  groupName.value = invite.name

  await authStore.ready

  if (!authStore.user) {
    status.value = 'auth_required'
    return
  }

  await acceptJoin()
})

async function acceptJoin() {
  try {
    const result = await groupsStore.acceptInvite(inviteCode)
    joinedGroupId.value = result?.groupId || ''
    status.value = 'joined'
  } catch (e) {
    if (e.message === 'wrong_email') {
      status.value = 'wrong_email'
    } else if (e.message.includes('already a member')) {
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
  <div class="flex items-center justify-center min-h-[calc(100dvh-4rem)] px-4">
    <AppCard padding="p-8" class="w-full max-w-md text-center">
      <template v-if="status === 'loading'">
        <Loader2 class="animate-spin h-8 w-8 text-primary-600 mx-auto" />
        <p class="mt-3 text-sm text-muted">Checking invite link...</p>
      </template>

      <template v-else-if="status === 'auth_required'">
        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock class="w-6 h-6 text-primary-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1 break-words">Join {{ groupName || 'this group' }}</h1>
        <p class="text-sm text-muted mb-5 break-words">
          Sign in or create an account to join this savings group automatically.
        </p>
        <div class="flex flex-col gap-2">
          <AppButton variant="primary" @click="goAuth('Register')">Create an account</AppButton>
          <AppButton variant="secondary" @click="goAuth('Login')">I already have an account</AppButton>
        </div>
      </template>

      <template v-else-if="status === 'joined'">
        <div class="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 class="w-6 h-6 text-success-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">You're in!</h1>
        <p class="text-sm text-muted mb-6 break-words">
          You've joined <span class="font-medium text-fg">{{ groupName }}</span>.
        </p>
        <div class="flex flex-col gap-2">
          <AppButton variant="primary" @click="router.push({ name: 'GroupDetail', params: { id: joinedGroupId } })">
            View group
          </AppButton>
          <AppButton variant="secondary" @click="router.push({ name: 'Dashboard' })">
            Go to dashboard
          </AppButton>
        </div>
      </template>

      <template v-else-if="status === 'wrong_email'">
        <div class="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-6 h-6 text-danger-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Wrong account</h1>
        <p class="text-sm text-muted mb-6 break-words">
          This invite was sent to a different account. Please sign in with the account it was
          addressed to, or ask the admin for a new invite.
        </p>
        <div class="flex flex-col gap-2">
          <AppButton variant="primary" @click="goAuth('Login')">Sign in with another account</AppButton>
          <AppButton variant="secondary" @click="router.push({ name: 'Dashboard' })">Go to dashboard</AppButton>
        </div>
      </template>

      <template v-else-if="status === 'already_member'">
        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users class="w-6 h-6 text-primary-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">You're already a member</h1>
        <p class="text-sm text-muted mb-6 break-words">You're already part of {{ groupName }}.</p>
        <AppButton variant="primary" @click="router.push({ name: 'Dashboard' })">Go to dashboard</AppButton>
      </template>

      <template v-else-if="status === 'mid_rotation'">
        <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock class="w-6 h-6 text-accent-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Group is mid-rotation</h1>
        <p class="text-sm text-muted mb-6 break-words">
          {{ groupName }} is currently mid-rotation. New members can join once every member has
          received the pot this rotation. Please check back later.
        </p>
        <AppButton variant="primary" @click="router.push({ name: 'Dashboard' })">Go to dashboard</AppButton>
      </template>

      <template v-else-if="status === 'invalid'">
        <div class="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-6 h-6 text-danger-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Invalid invite link</h1>
        <p class="text-sm text-muted mb-6 break-words">
          This invite link doesn't exist or has expired. Please ask the group admin for a new link.
        </p>
        <AppButton variant="primary" @click="router.push({ name: 'Landing' })">Go home</AppButton>
      </template>

      <template v-else>
        <div class="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-6 h-6 text-danger-600" />
        </div>
        <h1 class="text-xl font-bold text-fg mb-1">Something went wrong</h1>
        <p class="text-sm text-danger-600 mb-6 break-words">{{ error }}</p>
        <AppButton variant="primary" @click="router.push({ name: 'Landing' })">Go home</AppButton>
      </template>
    </AppCard>
  </div>
</template>
