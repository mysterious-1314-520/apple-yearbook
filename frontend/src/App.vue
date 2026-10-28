<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getYearbook, observeReveal } from './api'
import CampusSection from './components/CampusSection.vue'
import AppIcon from './components/AppIcon.vue'
import DockNav from './components/DockNav.vue'
import FacultySection from './components/FacultySection.vue'
import GallerySection from './components/GallerySection.vue'
import ProfilesSection from './components/ProfilesSection.vue'
import StudentModal from './components/StudentModal.vue'
import ToastView from './components/ToastView.vue'

const data = ref(null)
const error = ref('')
const activeStudent = ref(null)

const scrollY = ref(0)
const scrollPct = ref(0)
const showTop = ref(false)
let rafId = 0

const coverStyle = computed(() => ({
  transform: `translateY(${Math.min(scrollY.value * 0.25, 240)}px)`,
  opacity: Math.max(0, 1 - scrollY.value / 680)
}))

function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    const y = window.scrollY
    scrollY.value = y
    const max = document.documentElement.scrollHeight - window.innerHeight
    scrollPct.value = max > 0 ? Math.min(100, (y / max) * 100) : 0
    showTop.value = y > 640
  })
}

function gotoTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const tocItems = [
  { num: '01', target: 'preface', name: '卷首语', desc: '写在毕业之前的话', icon: 'quote' },
  { num: '02', target: 'campus', name: '校园生活记录', desc: '校园风光 · 流金岁月', icon: 'school' },
  { num: '03', target: 'teachers', name: '师生风采', desc: '教师寄语 · 学生代表', icon: 'users' },
  { num: '04', target: 'profiles', name: '个人资料页', desc: '我们的档案与赠言', icon: 'idcard' },
  { num: '05', target: 'gallery', name: '合影与签名', desc: '集体照 · 留言区', icon: 'camera' }
]

function openStudent(id) {
  activeStudent.value = data.value.students.find((s) => s.id === id) || null
}

function onStudentSaved(updated) {
  const target = data.value.students.find((s) => s.id === updated.id)
  if (target) Object.assign(target, updated)
}

function onMessageAdded(message) {
  data.value.messages.unshift(message)
}

function onMessageRemoved(id) {
  data.value.messages = data.value.messages.filter((m) => m.id !== id)
}

watch(data, async (value) => {
  if (value) {
    document.title = `同学录 · ${value.meta.school} ${value.meta.className}`
    await Promise.resolve()
    observeReveal()
  }
})

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  try {
    data.value = await getYearbook()
  } catch (err) {
    error.value = err.message
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="scroll-progress" :style="{ width: `${scrollPct}%` }" aria-hidden="true" />

  <div id="app">
    <p v-if="error" style="text-align:center;padding:40px;color:#ff3b30;">
      数据加载失败：{{ error }}
    </p>

    <div v-else-if="!data" class="loading-stage" aria-label="加载中">
      <div class="loading-cover">
        <div class="skeleton" style="width: 180px; height: 17px; border-radius: 9px;" />
        <div class="skeleton" style="width: min(420px, 72vw); height: 74px; border-radius: 18px;" />
        <div class="skeleton" style="width: 240px; height: 22px; border-radius: 11px;" />
        <div class="skeleton" style="width: 300px; height: 16px; border-radius: 8px;" />
      </div>
    </div>

    <template v-if="data">
      <!-- 1. 封面 + 封底 -->
      <header class="cover" id="cover">
        <div class="cover-glow" />
        <div class="cover-inner" :style="coverStyle">
          <span class="cover-emblem"><AppIcon name="cap" :size="34" sw="1.6" /></span>
          <p class="cover-eyebrow">{{ data.meta.school }}</p>
          <h1 class="cover-title">
            <span class="grad-text">{{ data.meta.className }}</span>
          </h1>
          <p class="cover-sub">Class of <span>{{ data.meta.gradYear }}</span></p>
          <p class="cover-motto">{{ data.meta.motto }}</p>
          <div class="cover-scroll">
            <span>向下滚动</span>
            <AppIcon name="chevronDown" :size="22" sw="2" class="scroll-chevron" />
          </div>
        </div>
        <div class="cover-back"><span>THE END · 毕业快乐</span></div>
      </header>

      <!-- 2. 目录页 -->
      <nav class="toc section" id="toc">
        <div class="section-head">
          <span class="head-ico"><AppIcon name="book" :size="24" sw="1.7" /></span>
          <p class="eyebrow">Contents</p>
          <h2>目录</h2>
        </div>
        <ol class="toc-list">
          <li v-for="item in tocItems" :key="item.num">
            <a :href="`#${item.target}`">
              <span class="toc-ico"><AppIcon :name="item.icon" :size="22" sw="1.7" /></span>
              <span class="toc-texts">
                <span class="toc-name"><b>{{ item.num }}</b>{{ item.name }}</span>
                <span class="toc-desc">{{ item.desc }}</span>
              </span>
              <AppIcon name="chevronRight" class="toc-arrow" :size="22" sw="2.2" />
            </a>
          </li>
        </ol>
      </nav>

      <!-- 3. 卷首语 -->
      <section class="section preface" id="preface">
        <div class="section-head">
          <span class="head-ico"><AppIcon name="quote" :size="24" sw="0" /></span>
          <p class="eyebrow">Foreword</p>
          <h2>卷首语</h2>
        </div>
        <blockquote class="preface-card">
          <AppIcon name="quote" :size="86" sw="0" class="preface-quote-mark" />
          <p class="preface-text">{{ data.meta.preface }}</p>
          <footer>—— {{ data.meta.prefaceAuthor }}</footer>
        </blockquote>
      </section>

      <!-- 4. 校园生活记录 -->
      <CampusSection :campus="data.campus" :moments="data.moments" />

      <!-- 5. 师生风采 -->
      <FacultySection :teachers="data.teachers" :students="data.students" @open="openStudent" />

      <!-- 6. 个人资料页 -->
      <ProfilesSection :students="data.students" @open="openStudent" />

      <!-- 7. 合影与签名 -->
      <GallerySection
        :gallery="data.gallery"
        :messages="data.messages"
        @added="onMessageAdded"
        @removed="onMessageRemoved"
      />

      <footer class="page-footer">
        <span class="footer-emblem"><AppIcon name="cap" :size="26" sw="1.6" /></span>
        <p>© {{ data.meta.gradYear }} {{ data.meta.school }} {{ data.meta.className }} · 同学录</p>
        <p class="footer-dim">Designed with Apple-style aesthetics</p>
      </footer>

      <StudentModal
        :student="activeStudent"
        @close="activeStudent = null"
        @saved="onStudentSaved"
      />
    </template>
  </div>

  <button
    class="to-top"
    :class="{ show: showTop }"
    type="button"
    aria-label="回到顶部"
    @click="gotoTop"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>

  <ToastView />
  <DockNav />
</template>
