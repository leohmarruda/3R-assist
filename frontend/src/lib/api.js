const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function formatErrorDetail(detail) {
  if (detail == null) {
    return ''
  }
  if (typeof detail !== 'object' || Array.isArray(detail)) {
    return String(detail)
  }

  const parts = []
  if (detail.type) {
    parts.push(String(detail.type))
  }
  if (detail.reason) {
    parts.push(String(detail.reason))
  }
  for (const [key, value] of Object.entries(detail)) {
    if (key === 'type' || key === 'reason' || value == null || value === '') {
      continue
    }
    parts.push(
      `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`,
    )
  }
  return parts.join(' — ')
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    let message = `API ${response.status}: ${response.statusText}`
    try {
      const body = await response.json()
      if (body?.error?.message) {
        message = body.error.message
        const detailText = formatErrorDetail(body.error.detail)
        if (detailText && !message.includes(detailText)) {
          message = `${message} (${detailText})`
        }
      }
    } catch {
      // keep default message
    }
    throw new Error(message)
  }
  return response.json()
}
