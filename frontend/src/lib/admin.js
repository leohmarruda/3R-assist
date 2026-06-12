import { apiFetch } from './api'

export function fetchAdminTables() {
  return apiFetch('/admin/tables')
}

export function fetchAdminTable(tableName, { limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  return apiFetch(`/admin/tables/${encodeURIComponent(tableName)}?${params}`)
}
