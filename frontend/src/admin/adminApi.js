const TOKEN_KEY = 'yb_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } })
  if (res.status === 401) {
    setToken('')
    throw new Error('登录已过期，请重新登录')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `请求失败 (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

export function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  })
}

export function adminLogout() {
  return request('/api/admin/logout', { method: 'POST' })
}

export function adminPutMeta(meta) {
  return request('/api/admin/meta', {
    method: 'PUT',
    body: JSON.stringify(meta)
  })
}

export function adminPutCollection(collection, items) {
  return request(`/api/admin/${collection}`, {
    method: 'PUT',
    body: JSON.stringify(items)
  })
}

export function adminExport() {
  return request('/api/admin/export')
}

export function adminReset() {
  return request('/api/admin/reset', { method: 'POST' })
}
