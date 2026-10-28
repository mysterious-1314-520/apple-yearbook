<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  campus: { type: Array, default: () => [] },
  moments: { type: Array, default: () => [] }
})
</script>

<template>
  <section class="section" id="campus">
    <div class="section-head">
      <span class="head-ico"><AppIcon name="school" :size="24" sw="1.7" /></span>
      <p class="eyebrow">Campus Life</p>
      <h2>校园生活记录</h2>
    </div>

    <h3 class="sub-title"><AppIcon name="star" :size="16" sw="1.7" />校园风光</h3>
    <div class="grid grid-4">
      <article v-for="c in campus" :key="c.id" class="card reveal">
        <div class="photo" :style="{ background: c.gradient }">
          <span class="photo-tile"><AppIcon :name="c.icon" :size="40" /></span>
        </div>
        <div class="card-body">
          <h4>{{ c.title }}</h4>
          <p>{{ c.desc }}</p>
        </div>
      </article>
    </div>

    <h3 class="sub-title"><AppIcon name="sunrise" :size="16" sw="1.7" />流金岁月</h3>
    <div class="timeline">
      <div v-for="m in moments" :key="m.id" class="timeline-item reveal">
        <div class="timeline-date">{{ m.date }} · {{ m.tag }}</div>
        <h4>{{ m.title }}</h4>
        <p>{{ m.desc }}</p>
      </div>
    </div>
  </section>
</template>
