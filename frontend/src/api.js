async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `请求失败 (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

export function getYearbook() {
  return request('/api/yearbook')
}

export function patchStudent(id, body) {
  return request(`/api/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export function postMessage(body) {
  return request('/api/messages', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export function deleteMessage(id) {
  return request(`/api/messages/${id}`, { method: 'DELETE' })
}

export function observeReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      })
    },
    { threshold: 0.12 }
  )
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el))
}
