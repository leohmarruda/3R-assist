const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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
      }
    } catch {
      // keep default message
    }
    throw new Error(message)
  }
  return response.json()
}
