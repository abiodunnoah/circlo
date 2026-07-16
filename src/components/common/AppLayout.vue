<script setup>
import AppNavbar from './AppNavbar.vue'
import AppToast from './AppToast.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <AppToast />
  </div>
</template>
