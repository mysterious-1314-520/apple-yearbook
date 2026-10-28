<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  students: { type: Array, default: () => [] }
})
const emit = defineEmits(['open'])
</script>

<template>
  <section class="section" id="profiles">
    <div class="section-head">
      <span class="head-ico"><AppIcon name="idcard" :size="24" sw="1.7" /></span>
      <p class="eyebrow">Profiles</p>
      <h2>个人资料页</h2>
      <p class="section-desc">点击卡片查看完整档案，可编辑自己的毕业感言与未来规划。</p>
    </div>
    <div class="grid grid-3">
      <article
        v-for="s in students"
        :key="s.id"
        class="card profile-card reveal"
        @click="emit('open', s.id)"
      >
        <div class="profile-head">
          <div class="avatar" :style="{ background: s.avatarGradient }">{{ s.initial }}</div>
          <div>
            <h4>{{ s.name }}</h4>
            <div class="meta">{{ s.constellation }}</div>
          </div>
        </div>
        <dl class="profile-rows">
          <div><dt><AppIcon name="phone" :size="14" sw="1.7" />电话</dt><dd>{{ s.phone }}</dd></div>
          <div><dt><AppIcon name="mail" :size="14" sw="1.7" />邮箱</dt><dd>{{ s.email }}</dd></div>
          <div><dt><AppIcon name="target" :size="14" sw="1.7" />未来规划</dt><dd>{{ s.plan }}</dd></div>
        </dl>
        <p class="profile-quote"><AppIcon name="quote" :size="16" sw="0" />{{ s.message }}</p>
      </article>
    </div>
  </section>
</template>
