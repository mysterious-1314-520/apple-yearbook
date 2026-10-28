import { reactive } from 'vue'

export const toasts = reactive([])
let seq = 0

export function toast(message, type = 'success') {
  const id = ++seq
  toasts.push({ id, message, type })
  window.setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx > -1) toasts.splice(idx, 1)
  }, 2800)
}
