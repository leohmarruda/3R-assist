const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`)
  }
  return response.json()
}
