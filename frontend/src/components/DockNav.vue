<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const items = [
  { target: 'cover', label: '封面', num: '', tile: 'linear-gradient(135deg, #48484a 0%, #1d1d1f 100%)', icon: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z', fill: true },
  { target: 'toc', label: '目录', num: '', tile: 'linear-gradient(135deg, #00a2ff 0%, #0071e3 100%)', path: 'M5 6h14M5 12h14M5 18h9', stroke: true },
  { target: 'campus', label: '校园', num: '02', tile: 'linear-gradient(135deg, #30d158 0%, #34c759 60%, #248a3d 100%)', icon: 'M4 20V9l8-5 8 5v11h-6v-6h-4v6z', fill: true },
  { target: 'teachers', label: '师生', num: '03', tile: 'linear-gradient(135deg, #ff9f0a 0%, #ff6b00 100%)', people: true },
  { target: 'profiles', label: '资料', num: '04', tile: 'linear-gradient(135deg, #7d7aff 0%, #5e5ce6 100%)', idcard: true },
  { target: 'gallery', label: '签名', num: '05', tile: 'linear-gradient(135deg, #ff5a8a 0%, #ff2d55 100%)', sign: true }
]

const active = ref('cover')
const hidden = ref(false)
const tracking = ref(false)
const bouncingIdx = ref(-1)
const dark = ref(true)

const dockRef = ref(null)
const itemEls = []
const metrics = reactive(items.map(() => ({ m: 1, push: 0, lift: 0 })))
let centers = []
let canHover = false
let bounceTimer = 0

watch(active, (value) => {
  dark.value = value === 'cover'
})

function tipText(item) {
  return item.num ? `${item.num} ${item.label}` : item.label
}

function setRef(el, i) {
  if (el) itemEls[i] = el
}

function styleFor(i) {
  const m = metrics[i]
  return { '--m': m.m, '--push': `${m.push}px`, '--lift': `${m.lift}px` }
}

function measure() {
  centers = itemEls.map((el) => (el ? el.offsetLeft + el.offsetWidth / 2 : 0))
}

function resetMetrics() {
  metrics.forEach((m) => {
    m.m = 1
    m.push = 0
    m.lift = 0
  })
  tracking.value = false
}

function onPointerMove(e) {
  const dock = dockRef.value
  if (!dock) return
  const rect = dock.getBoundingClientRect()
  dock.style.setProperty('--glow-x', `${e.clientX - rect.left}px`)
  if (!canHover) return
  const radius = 150
  tracking.value = true
  itemEls.forEach((el, i) => {
    if (!el) return
    const delta = e.clientX - (rect.left + centers[i])
    const dist = Math.abs(delta)
    const falloff = Math.max(0, 1 - dist / radius)
    const t = falloff * falloff
    metrics[i].m = 1 + 0.55 * t
    metrics[i].lift = -14 * t
    metrics[i].push = (delta > 0 ? 1 : -1) * 9 * t
  })
}

function onItemClick(i) {
  bouncingIdx.value = i
  window.clearTimeout(bounceTimer)
  bounceTimer = window.setTimeout(() => {
    bouncingIdx.value = -1
  }, 680)
}

let lastY = 0
function onScroll() {
  const y = window.scrollY
  if (y > 260 && y > lastY + 4) hidden.value = true
  else if (y < lastY - 4 || y < 260) hidden.value = false
  lastY = y
}

let observer = null

onMounted(async () => {
  canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  lastY = window.scrollY

  const map = new Map()
  items.forEach((it) => {
    const el = document.getElementById(it.target)
    if (el) map.set(el, it.target)
  })
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          active.value = map.get(entry.target)
        }
      })
    },
    { rootMargin: '-40% 0px -50% 0px' }
  )
  map.forEach((_, el) => observer.observe(el))

  await nextTick()
  measure()
  window.addEventListener('resize', measure)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', measure)
  window.removeEventListener('scroll', onScroll)
  window.clearTimeout(bounceTimer)
})
</script>

<template>
  <nav
    ref="dockRef"
    class="dock"
    :class="{ 'is-hidden': hidden, 'is-tracking': tracking, 'is-dark': dark }"
    aria-label="页面导航"
    @pointermove="onPointerMove"
    @pointerleave="resetMetrics"
  >
    <span class="dock-light" aria-hidden="true" />
    <a
      v-for="(item, i) in items"
      :key="item.target"
      :ref="(el) => setRef(el, i)"
      :href="`#${item.target}`"
      class="dock-item"
      :class="{ active: active === item.target, bouncing: bouncingIdx === i }"
      :style="styleFor(i)"
      :title="item.label"
      :aria-current="active === item.target ? 'true' : undefined"
      @click="onItemClick(i)"
    >
      <span class="dock-tile" :style="{ background: item.tile }">
        <svg viewBox="0 0 24 24">
          <path v-if="item.icon" :d="item.icon" />
          <path
            v-else-if="item.stroke"
            :d="item.path"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
          />
          <g v-else-if="item.people">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c.6-3 2.9-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
            <circle cx="17" cy="9" r="2.4" />
            <path d="M15 14.6c2.5-.4 4.8 1 5.5 4.4" />
          </g>
          <g v-else-if="item.idcard">
            <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8" />
            <circle cx="12" cy="10.5" r="2.4" />
            <path d="M8 17c.8-2 2.3-3 4-3s3.2 1 4 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </g>
          <g v-else-if="item.sign">
            <path d="M4 18c3 0 3-8 6-8s3 6 5 6 2-3 5-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M4 21h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5" />
          </g>
        </svg>
      </span>
      <span class="dock-name">{{ item.label }}</span>
      <i class="dock-dot" />
      <span class="dock-tip">{{ tipText(item) }}</span>
    </a>
  </nav>
</template>
