<script setup>
import { toasts } from '../toast'
import AppIcon from './AppIcon.vue'
</script>
<template>
  <div class="toast-stack" aria-live="polite">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast-pill" :class="t.type">
        <AppIcon :name="t.type === 'success' ? 'check' : 'alert'" :size="18" sw="2.4" class="toast-icon" />
        <span>{{ t.message }}</span>
      </div>
    </transition-group>
  </div>
</template>
