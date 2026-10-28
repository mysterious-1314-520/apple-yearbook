<script setup>
import { ref, watch } from 'vue'
import { patchStudent } from '../api'
import { toast } from '../toast'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  student: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])

const message = ref('')
const plan = ref('')
const saving = ref(false)

watch(
  () => props.student,
  (s) => {
    message.value = s ? s.message : ''
    plan.value = s ? s.plan : ''
  },
  { immediate: true }
)

async function save() {
  if (!props.student || saving.value) return
  saving.value = true
  try {
    const updated = await patchStudent(props.student.id, {
      message: message.value,
      plan: plan.value
    })
    emit('saved', updated)
    emit('close')
    toast('修改已保存')
  } catch (err) {
    toast(err.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="student" class="modal-mask" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="关闭" @click="emit('close')">
        <AppIcon name="x" :size="16" sw="2.2" />
      </button>
      <div class="avatar" :style="{ background: student.avatarGradient }">{{ student.initial }}</div>
      <h3>{{ student.name }}</h3>
      <p class="modal-meta"><AppIcon name="star" :size="13" sw="1.6" />{{ student.constellation }} · {{ student.specialty }}</p>
      <dl class="profile-rows">
        <div><dt><AppIcon name="phone" :size="14" sw="1.7" />电话</dt><dd>{{ student.phone }}</dd></div>
        <div><dt><AppIcon name="mail" :size="14" sw="1.7" />邮箱</dt><dd>{{ student.email }}</dd></div>
        <div><dt><AppIcon name="heart" :size="14" sw="1.7" />兴趣爱好</dt><dd>{{ student.hobbies }}</dd></div>
        <div><dt><AppIcon name="target" :size="14" sw="1.7" />未来规划</dt><dd>{{ student.plan }}</dd></div>
      </dl>
      <div class="modal-quote"><strong><AppIcon name="quote" :size="13" sw="0" />毕业感言</strong>{{ student.message }}</div>
      <div class="edit-box">
        <textarea v-model="message" rows="3" placeholder="修改你的毕业感言…" />
        <textarea v-model="plan" rows="2" placeholder="修改未来规划…" />
        <button class="btn-primary" :disabled="saving" @click="save">
          <AppIcon name="check" :size="16" sw="2.2" />
          {{ saving ? '保存中…' : '保存修改' }}
        </button>
      </div>
    </div>
  </div>
</template>
