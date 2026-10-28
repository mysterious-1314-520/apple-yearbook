<script setup>
import { ICONS } from '../icons'
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 },
  sw: { type: [Number, String], default: 1.8 }
})
</script>

<template>
  <svg
    class="app-icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.sw"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[props.name] || ''"
  />
</template>
