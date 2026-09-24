<script setup>
import { useRouter } from 'vue-router'
import { useNav } from '@/composables/useNav'

const router = useRouter()
const { bottomItems, isActive, badgeValue } = useNav()

function go(name) {
  router.push({ name })
}
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-line"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Primary"
  >
    <div class="flex items-stretch">
      <button
        v-for="item in bottomItems"
        :key="item.name"
        class="relative flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[11px] font-medium cursor-pointer"
        :class="isActive(item) ? 'text-primary-600' : 'text-fg-4'"
        :aria-current="isActive(item) ? 'page' : undefined"
        @click="go(item.name)"
      >
        <span
          v-if="isActive(item)"
          class="absolute top-0 h-0.5 w-8 bg-primary-600 rounded-full"
          aria-hidden="true"
        />
        <span class="relative mt-0.5">
          <component :is="item.icon" class="w-5 h-5" :stroke-width="isActive(item) ? 2.4 : 2" />
          <span
            v-if="badgeValue(item)"
            class="absolute -top-1 -right-2 bg-danger-500 text-inverse text-[10px] font-semibold rounded-full min-w-[1rem] h-4 px-1 flex items-center justify-center leading-none"
          >
            {{ badgeValue(item) }}
          </span>
        </span>
        <span class="w-full truncate text-center">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
