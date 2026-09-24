<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  align: { type: String, default: 'right' },
})

const open = ref(false)
const root = ref(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocPointer(e) {
  if (open.value && root.value && !root.value.contains(e.target)) close()
}

function onKey(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocPointer)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocPointer)
  document.removeEventListener('keydown', onKey)
})

defineExpose({ close })
</script>

<template>
  <div ref="root" class="relative inline-block">
    <div @click="toggle">
      <slot name="trigger" :open="open" :toggle="toggle" />
    </div>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      leave-active-class="transition duration-75 ease-in"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        role="menu"
        class="absolute z-30 mt-2 min-w-44 origin-top rounded-xl border border-line bg-card p-1 shadow-lg"
        :class="align === 'right' ? 'right-0' : 'left-0'"
        @click="close"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
