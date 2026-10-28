<script setup>
import AppIcon from './AppIcon.vue'
import { SUBJECT_ICONS } from '../icons'

defineProps({
  teachers: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] }
})
const emit = defineEmits(['open'])

function subjectIcon(subject) {
  return SUBJECT_ICONS[subject] || 'book'
}
</script>

<template>
  <section class="section" id="teachers">
    <div class="section-head">
      <span class="head-ico"><AppIcon name="users" :size="24" sw="1.7" /></span>
      <p class="eyebrow">Faculty &amp; Students</p>
      <h2>师生风采</h2>
    </div>
    <h3 class="sub-title"><AppIcon name="quote" :size="15" sw="0" />教师寄语</h3>
    <div class="grid grid-2">
      <article v-for="t in teachers" :key="t.id" class="card teacher-card reveal">
        <div class="avatar">{{ t.initial }}</div>
        <div class="teacher-info">
          <h4>{{ t.name }} 老师</h4>
          <div class="subject">
            <span class="subject-badge"><AppIcon :name="subjectIcon(t.subject)" :size="15" /></span>
            {{ t.subject }}
          </div>
          <p class="message">「{{ t.message }}」</p>
        </div>
      </article>
    </div>

    <h3 class="sub-title"><AppIcon name="cap" :size="16" sw="1.7" />学生代表</h3>
    <div class="grid grid-3">
      <article
        v-for="s in students"
        :key="s.id"
        class="card student-card reveal"
        @click="emit('open', s.id)"
      >
        <div class="avatar" :style="{ background: s.avatarGradient }">{{ s.initial }}</div>
        <h4>{{ s.name }}</h4>
        <div class="meta">
          <AppIcon name="star" :size="13" sw="1.6" />
          {{ s.constellation }} · {{ s.specialty }}
        </div>
        <div class="hobby"><AppIcon name="heart" :size="13" sw="1.6" />兴趣：{{ s.hobbies }}</div>
      </article>
    </div>
  </section>
</template>
