<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import ToastView from '../components/ToastView.vue'
import { toast } from '../toast'
import './admin.css'
import {
  adminExport,
  adminLogin,
  adminLogout,
  adminPutCollection,
  adminPutMeta,
  adminReset,
  getToken,
  setToken
} from './adminApi'

const gated = ref(!!getToken())
const password = ref('')
const logging = ref(false)
const loginError = ref('')
const data = ref(null)
const busy = ref('')
const tab = ref('meta')
const confirmReset = ref(false)
const confirmDel = ref(null)
const menuOpen = ref(false)

function closeMenu() {
  menuOpen.value = false
}

function onDocClick(e) {
  const target = e.target
  if (target.closest('.menu-trigger') || target.closest('.menu-pop')) return
  menuOpen.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') menuOpen.value = false
}

// 前台地址：本地按端口换，预览域名按前缀换（8001- → 3000-）
const frontHref = (() => {
  const m = location.hostname.match(/^(\d+)-(.+)$/)
  if (m) return `${location.protocol}//${m[1] === '8001' ? '3000' : m[1]}-${m[2]}/`
  if (location.port === '8001') return `${location.protocol}//${location.hostname}:3000/`
  return '/'
})()

const FIELDS = {
  meta: [
    { key: 'school', label: '学校', max: 40 },
    { key: 'className', label: '班级', max: 40 },
    { key: 'gradYear', label: '毕业年份', max: 4, num: true },
    { key: 'motto', label: '格言', max: 60 },
    { key: 'preface', label: '卷首语', max: 2000, area: true },
    { key: 'prefaceAuthor', label: '卷首语署名', max: 60 }
  ],
  campus: [
    { key: 'title', label: '标题', max: 40 },
    { key: 'desc', label: '描述', max: 160, area: true },
    { key: 'gradient', label: '渐变色', max: 120 },
    { key: 'icon', label: '图标', max: 30 }
  ],
  moments: [
    { key: 'title', label: '事件', max: 40 },
    { key: 'date', label: '时间', max: 20 },
    { key: 'tag', label: '标签', max: 20 },
    { key: 'desc', label: '描述', max: 160, area: true }
  ],
  teachers: [
    { key: 'name', label: '姓名', max: 20 },
    { key: 'initial', label: '头像字', max: 4 },
    { key: 'subject', label: '科目', max: 30 },
    { key: 'message', label: '寄语', max: 300, area: true }
  ],
  students: [
    { key: 'name', label: '姓名', max: 20 },
    { key: 'initial', label: '头像字', max: 4 },
    { key: 'constellation', label: '星座', max: 10 },
    { key: 'phone', label: '电话', max: 30 },
    { key: 'email', label: '邮箱', max: 60 },
    { key: 'hobbies', label: '兴趣', max: 80 },
    { key: 'specialty', label: '特长', max: 60 },
    { key: 'message', label: '毕业感言', max: 300, area: true },
    { key: 'plan', label: '未来规划', max: 80, area: true },
    { key: 'avatarGradient', label: '头像渐变', max: 120 }
  ],
  gallery: [
    { key: 'title', label: '标题', max: 40 },
    { key: 'type', label: '类型', max: 10 },
    { key: 'desc', label: '描述', max: 160, area: true },
    { key: 'gradient', label: '渐变色', max: 120 }
  ],
  messages: [
    { key: 'name', label: '留言人', max: 40 },
    { key: 'to', label: '送给', max: 40 },
    { key: 'content', label: '内容', max: 500, area: true }
  ]
}

const TABS = [
  { id: 'meta', name: '封面与卷首语', icon: 'cap' },
  { id: 'campus', name: '校园风光', icon: 'school' },
  { id: 'moments', name: '流金岁月', icon: 'sunrise' },
  { id: 'teachers', name: '教师寄语', icon: 'quote' },
  { id: 'students', name: '学生资料', icon: 'idcard' },
  { id: 'gallery', name: '合影照片', icon: 'camera' },
  { id: 'messages', name: '留言管理', icon: 'pen' }
]

const CURRENT_FIELDS = computed(() => FIELDS[tab.value] || [])

async function doLogin() {
  if (!password.value) return
  logging.value = true
  loginError.value = ''
  try {
    const res = await adminLogin(password.value)
    setToken(res.token)
    gated.value = true
    password.value = ''
    await load()
    toast('欢迎回来')
  } catch (err) {
    loginError.value = err.message
  } finally {
    logging.value = false
  }
}

async function doLogout() {
  try {
    await adminLogout()
  } catch {
    /* token 已失效也可退出 */
  }
  setToken('')
  gated.value = false
  data.value = null
}

async function load() {
  const res = await adminExport()
  data.value = {
    meta: { ...res.meta },
    campus: res.campus.map((x) => ({ ...x })),
    moments: res.moments.map((x) => ({ ...x })),
    teachers: res.teachers.map((x) => ({ ...x })),
    students: res.students.map((x) => ({ ...x })),
    gallery: res.gallery.map((x) => ({ ...x })),
    messages: res.messages.map((x) => ({ ...x }))
  }
}

async function saveTab() {
  busy.value = tab.value
  try {
    if (tab.value === 'meta') {
      const payload = { ...data.value.meta, gradYear: Number(data.value.meta.gradYear) }
      data.value.meta = await adminPutMeta(payload)
    } else {
      const saved = await adminPutCollection(tab.value, data.value[tab.value])
      data.value[tab.value] = saved
    }
    toast('已保存')
  } catch (err) {
    toast(err.message, 'error')
    if (/登录|401/.test(err.message)) gated.value = false
  } finally {
    busy.value = ''
  }
}

function addItem() {
  const blank = {}
  for (const f of FIELDS[tab.value]) blank[f.key] = f.num ? Number(data.value.meta?.gradYear) || 2026 : ''
  blank.id = `${tab.value}new${Date.now()}`
  if (tab.value === 'campus') blank.icon = 'school'
  if (tab.value === 'campus' || tab.value === 'gallery') blank.gradient = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  if (tab.value === 'students') blank.avatarGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  if (tab.value === 'messages') blank.to = '全班同学'
  data.value[tab.value].push(blank)
}

function removeItem(index) {
  data.value[tab.value].splice(index, 1)
  confirmDel.value = null
}

function moveItem(index, delta) {
  const list = data.value[tab.value]
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
}

async function exportJson() {
  try {
    const db = await adminExport()
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'db.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('已导出 db.json')
  } catch (err) {
    toast(err.message, 'error')
  }
}

async function resetAll() {
  busy.value = 'reset'
  try {
    data.value = await adminReset()
    confirmReset.value = false
    toast('已恢复默认数据')
  } catch (err) {
    toast(err.message, 'error')
  } finally {
    busy.value = ''
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
  if (gated.value) {
    try {
      await load()
    } catch {
      gated.value = false
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="admin">
    <!-- 登录 -->
    <div v-if="!gated" class="admin-login">
      <div class="login-aurora" aria-hidden="true" />
      <form class="login-card" @submit.prevent="doLogin">
        <span class="login-emblem"><AppIcon name="cap" :size="34" sw="1.6" /></span>
        <p class="login-eyebrow">Yearbook Admin</p>
        <h1>同学录管理后台</h1>
        <p class="login-sub">输入管理密码以编辑前台内容</p>
        <input
          v-model="password"
          type="password"
          placeholder="管理密码"
          autofocus
          autocomplete="current-password"
        />
        <p v-if="loginError" class="login-error">{{ loginError }}</p>
        <button class="btn-primary" type="submit" :disabled="logging || !password">
          {{ logging ? '登录中…' : '登录' }}
        </button>
        <a class="login-back" :href="frontHref">← 返回同学录</a>
      </form>
    </div>

    <!-- 管理面板 -->
    <div v-else class="admin-shell">
      <header class="admin-top">
        <div class="admin-brand">
          <span class="brand-ico"><AppIcon name="cap" :size="20" sw="1.7" /></span>
          <strong>同学录后台</strong>
        </div>
        <div class="admin-top-right">
          <span class="top-meta">{{ TABS.find((t) => t.id === tab)?.name }}</span>
          <div class="admin-menu">
            <button
              class="menu-trigger"
              type="button"
              :aria-expanded="menuOpen"
              aria-haspopup="menu"
              @click.stop="menuOpen = !menuOpen"
            >
              <span class="menu-avatar"><AppIcon name="cap" :size="13" sw="1.9" /></span>
              <span class="menu-trigger-text">管理</span>
              <AppIcon
                name="chevronDown"
                :size="13"
                sw="2.2"
                :class="['menu-caret', { open: menuOpen }]"
              />
            </button>
            <transition name="menu-pop">
              <div v-if="menuOpen" class="menu-pop" role="menu" @click.stop>
                <a class="menu-row" :href="frontHref" target="_blank" role="menuitem">
                  <AppIcon name="globe" :size="15" sw="1.8" />
                  <span>查看前台</span>
                  <AppIcon name="arrowUp" :size="13" sw="2" class="menu-row-tail" />
                </a>
                <button class="menu-row" type="button" role="menuitem" @click="exportJson(); closeMenu()">
                  <AppIcon name="pen" :size="15" sw="1.8" />
                  <span>导出 JSON</span>
                </button>
                <button class="menu-row danger" type="button" role="menuitem" @click="confirmReset = true; closeMenu()">
                  <AppIcon name="alert" :size="15" sw="1.8" />
                  <span>恢复默认</span>
                </button>
                <div class="menu-sep" />
                <button class="menu-row danger" type="button" role="menuitem" @click="doLogout(); closeMenu()">
                  <AppIcon name="x" :size="15" sw="2" />
                  <span>退出</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <div v-if="!data" class="admin-loading">加载中…</div>

      <div v-else class="admin-body">
        <nav class="admin-side">
          <div class="side-traffic" aria-hidden="true"><i /><i /><i /></div>
          <p class="side-label">内容</p>
          <div class="side-menu">
            <button
              v-for="t in TABS"
              :key="t.id"
              type="button"
              :class="['side-item', 'tile-' + t.id, { active: tab === t.id }]"
              :title="t.name"
              @click="tab = t.id"
            >
              <span class="side-tile"><AppIcon :name="t.icon" :size="15" sw="1.8" /></span>
              <span>{{ t.name }}</span>
              <em v-if="t.id !== 'meta'">{{ data[t.id].length }}</em>
            </button>
          </div>
        </nav>

        <main class="admin-main">
          <div class="main-head">
            <div>
              <h2>{{ TABS.find((t) => t.id === tab)?.name }}</h2>
              <p class="main-sub">
                {{ tab === 'meta' ? '封面标题、格言与卷首语' : `共 ${data[tab].length} 条，可增删、排序后保存` }}
              </p>
            </div>
            <div class="main-btns">
              <button v-if="tab !== 'meta'" class="btn-ghost" type="button" @click="addItem">
                <AppIcon name="check" :size="15" sw="2.2" />新增一条
              </button>
              <button
                class="btn-primary"
                type="button"
                :disabled="busy === tab"
                @click="saveTab"
              >
                {{ busy === tab ? '保存中…' : '保存本页' }}
              </button>
            </div>
          </div>

          <!-- meta 单卡片 -->
          <div v-if="tab === 'meta'" class="edit-card">
            <label v-for="f in CURRENT_FIELDS" :key="f.key" class="field">
              <span>{{ f.label }}</span>
              <textarea
                v-if="f.area"
                v-model="data.meta[f.key]"
                :maxlength="f.max"
                rows="7"
              />
              <input
                v-else
                v-model="data.meta[f.key]"
                :maxlength="f.max"
                :inputmode="f.num ? 'numeric' : undefined"
              />
            </label>
          </div>

          <!-- 集合列表 -->
          <div v-else class="edit-list">
            <article v-for="(item, i) in data[tab]" :key="item.id" class="edit-card">
              <header class="card-top">
                <span class="card-index">#{{ i + 1 }}</span>
                <div class="card-tools">
                  <button type="button" title="上移" :disabled="i === 0" @click="moveItem(i, -1)">
                    <AppIcon name="arrowUp" :size="15" sw="2.2" />
                  </button>
                  <button
                    type="button"
                    title="下移"
                    :disabled="i === data[tab].length - 1"
                    @click="moveItem(i, 1)"
                  >
                    <AppIcon name="chevronDown" :size="15" sw="2.2" />
                  </button>
                  <button
                    type="button"
                    class="del"
                    :class="{ armed: confirmDel === item.id }"
                    :title="confirmDel === item.id ? '再点一次确认删除' : '删除'"
                    @click="confirmDel === item.id ? removeItem(i) : (confirmDel = item.id)"
                  >
                    <AppIcon name="trash" :size="15" sw="1.9" />
                  </button>
                </div>
              </header>
              <div class="field-grid">
                <label v-for="f in CURRENT_FIELDS" :key="f.key" class="field">
                  <span>{{ f.label }}</span>
                  <textarea v-if="f.area" v-model="item[f.key]" :maxlength="f.max" rows="3" />
                  <input v-else v-model="item[f.key]" :maxlength="f.max" />
                </label>
              </div>
            </article>

            <p v-if="!data[tab].length" class="empty-tip">暂无数据，点「新增一条」开始。</p>
          </div>
        </main>
      </div>

      <!-- 恢复默认确认 -->
      <div v-if="confirmReset" class="mask" @click.self="confirmReset = false">
        <div class="dialog">
          <h3>恢复默认数据？</h3>
          <p>当前全部内容会被替换为初始种子数据，且无法撤销。</p>
          <div class="dialog-btns">
            <button class="btn-ghost" type="button" @click="confirmReset = false">取消</button>
            <button class="btn-danger" type="button" :disabled="busy === 'reset'" @click="resetAll">
              {{ busy === 'reset' ? '恢复中…' : '确认恢复' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <ToastView />
  </div>
</template>
