<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { deleteMessage, postMessage } from '../api'
import { toast } from '../toast'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  gallery: { type: Array, default: () => [] },
  messages: { type: Array, default: () => [] }
})
const emit = defineEmits(['added', 'removed'])

const name = ref('')
const to = ref('')
const content = ref('')
const submitting = ref(false)
const error = ref('')
const pendingDel = ref('')
let delTimer = 0

function formatTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function submit() {
  if (submitting.value) return
  error.value = ''
  submitting.value = true
  try {
    const message = await postMessage({
      name: name.value,
      to: to.value || '全班同学',
      content: content.value
    })
    emit('added', message)
    content.value = ''
    toast('签名已留下，毕业快乐')
  } catch (err) {
    error.value = err.message
    toast(err.message, 'error')
  } finally {
    submitting.value = false
  }
}

async function requestRemove(id) {
  if (pendingDel.value !== id) {
    pendingDel.value = id
    window.clearTimeout(delTimer)
    delTimer = window.setTimeout(() => {
      pendingDel.value = ''
    }, 3000)
    return
  }
  window.clearTimeout(delTimer)
  pendingDel.value = ''
  try {
    await deleteMessage(id)
    emit('removed', id)
    toast('留言已删除')
  } catch (err) {
    toast(err.message, 'error')
  }
}

onBeforeUnmount(() => window.clearTimeout(delTimer))
</script>

<template>
  <section class="section" id="gallery">
    <div class="section-head">
      <span class="head-ico"><AppIcon name="camera" :size="24" sw="1.7" /></span>
      <p class="eyebrow">Photos &amp; Signatures</p>
      <h2>合影与签名</h2>
    </div>

    <div class="grid grid-2">
      <article v-for="g in gallery" :key="g.id" class="card reveal">
        <div class="photo" :style="{ background: g.gradient, height: '190px' }">
          <span class="photo-tile photo-tile-lg"><AppIcon name="camera" :size="46" /></span>
        </div>
        <div class="card-body">
          <span class="tag">{{ g.type }}</span>
          <h4>{{ g.title }}</h4>
          <p>{{ g.desc }}</p>
        </div>
      </article>
    </div>

    <h3 class="sub-title"><AppIcon name="pen" :size="15" sw="1.7" />留言区</h3>
    <form class="msg-form card" @submit.prevent="submit">
      <div class="form-row">
        <input v-model="name" type="text" placeholder="你的名字" maxlength="40" required />
        <input v-model="to" type="text" placeholder="想对谁说（可留空）" maxlength="40" />
      </div>
      <textarea
        v-model="content"
        placeholder="写下你的祝福或回忆片段…"
        maxlength="500"
        rows="3"
        required
      />
      <p v-if="error" class="form-error">{{ error }}</p>
      <button type="submit" class="btn-primary" :disabled="submitting">
        <AppIcon name="pen" :size="16" sw="2" />
        {{ submitting ? '提交中…' : '签名留念' }}
      </button>
    </form>

    <div class="msg-list">
      <article v-for="m in messages" :key="m.id" class="msg-card">
        <div class="msg-top">
          <div class="msg-author">{{ m.name }} <span>→ {{ m.to }}</span></div>
          <time class="msg-time">{{ formatTime(m.createdAt) }}</time>
        </div>
        <p class="msg-content">{{ m.content }}</p>
        <button
          class="msg-del"
          :class="{ armed: pendingDel === m.id }"
          type="button"
          @click="requestRemove(m.id)"
        >
          <AppIcon :name="pendingDel === m.id ? 'alert' : 'trash'" :size="13" sw="2" />
          {{ pendingDel === m.id ? '再点一次确认' : '删除' }}
        </button>
      </article>
    </div>
  </section>
</template>
