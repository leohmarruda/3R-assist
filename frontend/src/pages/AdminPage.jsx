import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteAdminRows,
  fetchAdminTable,
  fetchAdminTables,
  insertAdminRow,
  updateAdminCell,
  updateAdminColumnComment,
} from '../lib/admin'

const PAGE_SIZE = 10
const MAIN_TABS = ['database', 'docs', 'settings']

function formatCell(value) {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function toDraft(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function fromDraft(draft, original) {
  const trimmed = draft.trim()
  if (trimmed === '') {
    return null
  }
  if (typeof original === 'object' && original !== null) {
    return JSON.parse(trimmed)
  }
  if (typeof original === 'boolean') {
    const lower = trimmed.toLowerCase()
    if (lower === 'true') return true
    if (lower === 'false') return false
    return trimmed
  }
  if (typeof original === 'number') {
    const number = Number(trimmed)
    return Number.isNaN(number) ? trimmed : number
  }
  return draft
}

function rowKey(row, primaryKey, fallback) {
  if (!primaryKey?.length) {
    return fallback
  }
  return primaryKey.map((column) => String(row[column])).join('|')
}

function primaryKeyValues(row, primaryKey) {
  return Object.fromEntries(primaryKey.map((column) => [column, row[column]]))
}

function tabClass(isActive) {
  return isActive
    ? 'border-b-2 border-primary px-3 py-2 font-nav-link text-nav-link font-medium text-primary'
    : 'px-3 py-2 font-nav-link text-nav-link text-on-secondary-container transition-colors hover:text-primary'
}

function HintIcon({ label, description, hasComment, onClick }) {
  const tooltip = description || label
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={tooltip}
      className={`ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium leading-none transition-colors ${
        hasComment
          ? 'border-primary text-primary hover:bg-primary hover:text-on-primary'
          : 'border-on-surface-variant/40 text-on-surface-variant/60 hover:border-primary hover:text-primary'
      }`}
    >
      i
    </button>
  )
}

function CloseIconButton({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-on-secondary-container transition-colors hover:bg-surface-container hover:text-primary disabled:opacity-40"
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  )
}

function AddRowModal({
  table,
  columns,
  comments,
  types,
  requiredColumns = [],
  foreignKeys = {},
  columnOptions = {},
  onClose,
  onCreated,
}) {
  const { t } = useTranslation()
  const requiredSet = new Set(requiredColumns)
  const [values, setValues] = useState(() =>
    Object.fromEntries(columns.map((column) => [column, ''])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  function updateValue(column, value) {
    setValues((current) => ({
      ...current,
      [column]: value,
    }))
  }

  async function submit() {
    if (saving) return

    const missing = columns.filter(
      (column) =>
        requiredSet.has(column) && String(values[column] ?? '').trim() === '',
    )
    if (missing.length > 0) {
      setError(t('admin.requiredFieldsMissing', { fields: missing.join(', ') }))
      return
    }

    setSaving(true)
    setError(null)
    try {
      const result = await insertAdminRow(table, values)
      onCreated(result.row)
    } catch (err) {
      setError(err.message ?? t('admin.addRowError'))
    } finally {
      setSaving(false)
    }
  }

  const fieldClass =
    'w-full rounded border border-border-subtle bg-surface-container-lowest px-3 py-2 font-metadata text-metadata text-on-surface outline-none focus:border-primary'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-container-padding py-section-gap"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-row-title"
        className="flex max-h-full w-full max-w-3xl flex-col rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding shadow-lg"
      >
        <div className="mb-card-gap flex items-start justify-between gap-3">
          <h2
            id="add-row-title"
            className="font-headline-lg text-headline-lg text-primary"
          >
            {t('admin.addRow')}
          </h2>
          <CloseIconButton
            label={t('admin.close')}
            disabled={saving}
            onClick={onClose}
          />
        </div>

        {error && (
          <p className="mb-card-gap font-metadata text-metadata text-error" role="alert">
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 space-y-card-gap overflow-y-auto pr-1">
          {columns.map((column, index) => {
            const hint = comments?.[column]
            const type = types?.[column]
            const required = requiredSet.has(column)
            const options = columnOptions?.[column] ?? []
            const foreignKey = foreignKeys?.[column]
            const useSelect = options.length > 0

            return (
              <div
                key={column}
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start sm:gap-4"
              >
                <label className="block min-w-0">
                  <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
                    {column}
                    {required ? (
                      <span className="ml-0.5 text-error" aria-hidden="true">
                        *
                      </span>
                    ) : null}
                    {type ? (
                      <span className="ml-1 normal-case opacity-65">({type})</span>
                    ) : null}
                    {foreignKey ? (
                      <span className="ml-1 normal-case opacity-65">
                        → {foreignKey.table}.{foreignKey.column}
                      </span>
                    ) : null}
                  </span>
                  {useSelect ? (
                    <select
                      autoFocus={index === 0}
                      value={values[column] ?? ''}
                      disabled={saving}
                      required={required}
                      onChange={(event) => updateValue(column, event.target.value)}
                      className={fieldClass}
                    >
                      <option value="">
                        {required
                          ? t('admin.selectRequired')
                          : t('admin.selectOptional')}
                      </option>
                      {options.map((option) => (
                        <option
                          key={String(option.value)}
                          value={String(option.value)}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      autoFocus={index === 0}
                      value={values[column] ?? ''}
                      disabled={saving}
                      required={required}
                      onChange={(event) => updateValue(column, event.target.value)}
                      className={fieldClass}
                    />
                  )}
                </label>
                <p className="whitespace-pre-wrap font-metadata text-metadata text-on-secondary-container opacity-65 sm:pt-6">
                  {hint || t('admin.noCommentHint')}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-card-gap flex gap-3 border-t border-border-subtle pt-card-gap">
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="font-metadata text-metadata text-primary hover:underline disabled:opacity-40"
          >
            {saving ? t('admin.saving') : t('admin.ok')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="font-metadata text-metadata text-on-secondary-container hover:underline disabled:opacity-40"
          >
            {t('admin.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ColumnCommentModal({ table, column, comment, onClose, onSaved }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving) {
        if (editing) {
          setEditing(false)
          setDraft(comment ?? '')
          setError(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [comment, editing, onClose, saving])

  function startEdit() {
    if (saving) return
    setError(null)
    setDraft(comment ?? '')
    setEditing(true)
  }

  function cancelEdit() {
    if (saving) return
    setEditing(false)
    setDraft(comment ?? '')
    setError(null)
  }

  async function saveEdit() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const result = await updateAdminColumnComment(table, column, draft)
      onSaved(result.comment)
      setEditing(false)
    } catch (err) {
      setError(err.message ?? t('admin.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-container-padding"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving && !editing) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="column-comment-title"
        className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding shadow-lg"
      >
        <div className="mb-card-gap flex items-start justify-between gap-3">
          <div>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              {t('admin.columnComment')}
            </p>
            <h2
              id="column-comment-title"
              className="mt-fine-gap font-headline-lg text-headline-lg text-primary"
            >
              {column}
            </h2>
          </div>
          <CloseIconButton
            label={t('admin.close')}
            disabled={saving}
            onClick={onClose}
          />
        </div>

        {error && (
          <p className="mb-card-gap font-metadata text-metadata text-error" role="alert">
            {error}
          </p>
        )}

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              rows={6}
              value={draft}
              disabled={saving}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  saveEdit()
                }
              }}
              className="w-full rounded border border-border-subtle bg-surface-container-lowest px-3 py-2 font-body-base text-body-base text-on-surface outline-none focus:border-primary"
            />
            <div className="flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={saveEdit}
                className="font-metadata text-metadata text-primary hover:underline disabled:opacity-40"
              >
                {saving ? t('admin.saving') : t('admin.save')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={cancelEdit}
                className="font-metadata text-metadata text-on-secondary-container hover:underline disabled:opacity-40"
              >
                {t('admin.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <p
            onDoubleClick={startEdit}
            title={t('admin.editHint')}
            className="min-h-[6rem] cursor-text whitespace-pre-wrap rounded border border-transparent px-1 py-1 font-body-base text-body-base text-on-surface hover:border-border-subtle"
          >
            {comment ? (
              comment
            ) : (
              <span className="text-on-secondary-container opacity-65">
                {t('admin.noComment')}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

function DatabasePanel() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
  const [page, setPage] = useState(0)
  const [tableData, setTableData] = useState(null)
  const [loadingTables, setLoadingTables] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState(null)
  const [edit, setEdit] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [commentColumn, setCommentColumn] = useState(null)
  const [showAddRow, setShowAddRow] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTables() {
      setLoadingTables(true)
      setError(null)
      try {
        const result = await fetchAdminTables()
        if (cancelled) return
        setTables(result.tables)
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? t('admin.loadError'))
        }
      } finally {
        if (!cancelled) {
          setLoadingTables(false)
        }
      }
    }

    loadTables()
    return () => {
      cancelled = true
    }
  }, [t])

  useEffect(() => {
    if (tables.length === 0) return

    const fromHash = location.hash.replace(/^#/, '')
    if (fromHash && tables.includes(fromHash)) {
      setActiveTable(fromHash)
      return
    }

    setActiveTable((current) => current ?? tables[0])
  }, [tables, location.hash])

  function selectTable(table) {
    setActiveTable(table)
    setPage(0)
    setEdit(null)
    setSelected({})
    setConfirmDelete(false)
    setCommentColumn(null)
    setShowAddRow(false)
    navigate(`/admin/database#${table}`, { replace: true })
  }

  useEffect(() => {
    if (!activeTable) {
      setTableData(null)
      return undefined
    }

    let cancelled = false

    async function loadTable() {
      setLoadingData(true)
      setError(null)
      setEdit(null)
      setSelected({})
      setConfirmDelete(false)
      setCommentColumn(null)
      setShowAddRow(false)
      try {
        const result = await fetchAdminTable(activeTable, {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        })
        if (!cancelled) {
          setTableData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setTableData(null)
          setError(err.message ?? t('admin.loadError'))
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false)
        }
      }
    }

    loadTable()
    return () => {
      cancelled = true
    }
  }, [activeTable, page, t])

  const primaryKey = tableData?.primary_key ?? []
  const totalPages = tableData ? Math.max(1, Math.ceil(tableData.total / PAGE_SIZE)) : 1
  const selectedKeys = Object.keys(selected)
  const selectedCount = selectedKeys.length
  const pageRowKeys =
    tableData?.rows.map((row, index) =>
      rowKey(row, primaryKey, `${activeTable}-${tableData.offset + index}`),
    ) ?? []
  const allPageSelected =
    pageRowKeys.length > 0 && pageRowKeys.every((key) => selected[key])

  function startEdit(row, column) {
    if (!primaryKey.length || primaryKey.includes(column) || saving || deleting) {
      return
    }
    setError(null)
    setConfirmDelete(false)
    setEdit({
      rowKey: rowKey(row, primaryKey),
      column,
      draft: toDraft(row[column]),
      original: row[column],
      primaryKey: primaryKeyValues(row, primaryKey),
    })
  }

  function cancelEdit() {
    if (saving) return
    setEdit(null)
  }

  function toggleRow(row, key) {
    if (!primaryKey.length || deleting) return
    setConfirmDelete(false)
    setSelected((current) => {
      if (current[key]) {
        const next = { ...current }
        delete next[key]
        return next
      }
      return {
        ...current,
        [key]: primaryKeyValues(row, primaryKey),
      }
    })
  }

  function toggleAllPageRows() {
    if (!primaryKey.length || !tableData || deleting) return
    setConfirmDelete(false)
    setSelected((current) => {
      if (allPageSelected) {
        const next = { ...current }
        for (const key of pageRowKeys) {
          delete next[key]
        }
        return next
      }
      const next = { ...current }
      tableData.rows.forEach((row, index) => {
        const key = rowKey(
          row,
          primaryKey,
          `${activeTable}-${tableData.offset + index}`,
        )
        next[key] = primaryKeyValues(row, primaryKey)
      })
      return next
    })
  }

  function requestDelete() {
    if (selectedCount === 0 || deleting) return
    setEdit(null)
    setError(null)
    setConfirmDelete(true)
  }

  function cancelDelete() {
    if (deleting) return
    setConfirmDelete(false)
  }

  async function confirmDeleteRows() {
    if (!activeTable || !tableData || selectedCount === 0 || deleting) return

    setDeleting(true)
    setError(null)
    try {
      const result = await deleteAdminRows(activeTable, Object.values(selected))
      const remaining = Math.max(0, tableData.total - result.deleted)
      const maxPage = Math.max(0, Math.ceil(remaining / PAGE_SIZE) - 1)
      setSelected({})
      setConfirmDelete(false)
      setEdit(null)
      if (page > maxPage) {
        setPage(maxPage)
      } else {
        const refreshed = await fetchAdminTable(activeTable, {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        })
        setTableData(refreshed)
      }
    } catch (err) {
      setError(err.message ?? t('admin.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  async function saveEdit() {
    if (!edit || !activeTable || saving) return

    let value
    try {
      value = fromDraft(edit.draft, edit.original)
    } catch {
      setError(t('admin.invalidValue'))
      return
    }

    setSaving(true)
    setError(null)
    try {
      const result = await updateAdminCell(activeTable, {
        primaryKey: edit.primaryKey,
        column: edit.column,
        value,
      })
      setTableData((current) => {
        if (!current) return current
        return {
          ...current,
          rows: current.rows.map((row) =>
            rowKey(row, current.primary_key) === edit.rowKey ? result.row : row,
          ),
        }
      })
      setEdit(null)
    } catch (err) {
      setError(err.message ?? t('admin.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {error && (
        <p className="mb-card-gap font-metadata text-metadata text-error" role="alert">
          {error}
        </p>
      )}

      {loadingTables ? (
        <p className="font-body-base text-body-base text-on-secondary-container">
          {t('admin.loading')}
        </p>
      ) : error && tables.length === 0 ? null : tables.length === 0 ? (
        <p className="font-body-base text-body-base text-on-secondary-container">
          {t('admin.noTables')}
        </p>
      ) : (
        <>
          <div
            className="mb-card-gap flex flex-wrap gap-2 border-b border-border-subtle"
            role="tablist"
            aria-label={t('admin.tablesLabel')}
          >
            {tables.map((table) => {
              const isActive = table === activeTable
              return (
                <button
                  key={table}
                  id={table}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectTable(table)}
                  className={tabClass(isActive)}
                >
                  {table}
                </button>
              )
            })}
          </div>

          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding">
            {loadingData ? (
              <p className="font-body-base text-body-base text-on-secondary-container">
                {t('admin.loading')}
              </p>
            ) : tableData ? (
              <>
                <div className="mb-card-gap flex flex-wrap items-center justify-between gap-3">
                  <p className="font-metadata text-metadata text-on-secondary-container">
                    {tableData.total === 0
                      ? t('admin.emptyTable')
                      : t('admin.rowCount', {
                          from: tableData.offset + 1,
                          to: tableData.offset + tableData.rows.length,
                          total: tableData.total,
                        })}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {tableData.columns.length > 0 ? (
                      <button
                        type="button"
                        disabled={saving || deleting}
                        onClick={() => {
                          setCommentColumn(null)
                          setConfirmDelete(false)
                          setShowAddRow(true)
                        }}
                        className="font-metadata text-metadata text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t('admin.addRow')}
                      </button>
                    ) : null}
                    {primaryKey.length > 0 && tableData.rows.length > 0 ? (
                      confirmDelete ? (
                        <div className="flex items-center gap-3">
                          <span className="font-metadata text-metadata text-on-secondary-container">
                            {t('admin.deleteConfirm', { count: selectedCount })}
                          </span>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={confirmDeleteRows}
                            className="font-metadata text-metadata text-error hover:underline disabled:opacity-40"
                          >
                            {deleting ? t('admin.deleting') : t('admin.deleteConfirmAction')}
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={cancelDelete}
                            className="font-metadata text-metadata text-on-secondary-container hover:underline disabled:opacity-40"
                          >
                            {t('admin.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={selectedCount === 0 || saving}
                          onClick={requestDelete}
                          className="font-metadata text-metadata text-error hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {selectedCount > 0
                            ? t('admin.deleteSelected', { count: selectedCount })
                            : t('admin.delete')}
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
                {tableData.rows.length === 0 ? null : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-max min-w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border-subtle">
                            {primaryKey.length > 0 ? (
                              <th className="w-8 px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={allPageSelected}
                                  disabled={deleting}
                                  onChange={toggleAllPageRows}
                                  aria-label={t('admin.selectAll')}
                                  className="align-middle"
                                />
                              </th>
                            ) : null}
                            {tableData.columns.map((column) => {
                              const comment = tableData.column_comments?.[column] ?? null
                              return (
                                <th
                                  key={column}
                                  className="whitespace-nowrap px-3 py-2 font-label-caps text-label-caps uppercase text-on-surface-variant"
                                >
                                  <span className="inline-flex items-center">
                                    {column}
                                    <HintIcon
                                      label={t('admin.columnCommentHint', {
                                        column,
                                      })}
                                      description={comment || t('admin.noCommentHint')}
                                      hasComment={Boolean(comment)}
                                      onClick={() => setCommentColumn(column)}
                                    />
                                  </span>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle font-metadata text-metadata">
                          {tableData.rows.map((row, index) => {
                            const currentRowKey = rowKey(
                              row,
                              primaryKey,
                              `${activeTable}-${tableData.offset + index}`,
                            )
                            return (
                              <tr
                                key={currentRowKey}
                                className={selected[currentRowKey] ? 'bg-surface-container' : ''}
                              >
                                {primaryKey.length > 0 ? (
                                  <td className="w-8 px-3 py-2 align-top">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(selected[currentRowKey])}
                                      disabled={deleting}
                                      onChange={() => toggleRow(row, currentRowKey)}
                                      aria-label={t('admin.selectRow')}
                                      className="align-middle"
                                    />
                                  </td>
                                ) : null}
                                {tableData.columns.map((column) => {
                                  const isPk = primaryKey.includes(column)
                                  const isEditing =
                                    edit?.rowKey === currentRowKey &&
                                    edit?.column === column
                                  const useTextarea =
                                    isEditing &&
                                    (typeof edit.original === 'object' ||
                                      edit.draft.length > 60)

                                  return (
                                    <td
                                      key={column}
                                      className={`px-3 py-2 align-top text-on-surface ${
                                        isEditing ? '' : 'whitespace-nowrap'
                                      } ${
                                        isPk || !primaryKey.length
                                          ? ''
                                          : 'cursor-text'
                                      }`}
                                      onDoubleClick={() => startEdit(row, column)}
                                      title={
                                        isPk || !primaryKey.length
                                          ? undefined
                                          : t('admin.editHint')
                                      }
                                    >
                                      {isEditing ? (
                                        <div className="flex min-w-[12rem] flex-col gap-1">
                                          {useTextarea ? (
                                            <textarea
                                              autoFocus
                                              rows={4}
                                              value={edit.draft}
                                              disabled={saving}
                                              onChange={(event) =>
                                                setEdit((current) =>
                                                  current
                                                    ? {
                                                        ...current,
                                                        draft: event.target.value,
                                                      }
                                                    : current,
                                                )
                                              }
                                              onKeyDown={(event) => {
                                                if (
                                                  event.key === 'Escape'
                                                ) {
                                                  event.preventDefault()
                                                  cancelEdit()
                                                }
                                                if (
                                                  event.key === 'Enter' &&
                                                  (event.metaKey || event.ctrlKey)
                                                ) {
                                                  event.preventDefault()
                                                  saveEdit()
                                                }
                                              }}
                                              className="w-full min-w-[12rem] rounded border border-border-subtle bg-surface-container-lowest px-2 py-1 font-metadata text-metadata text-on-surface outline-none focus:border-primary"
                                            />
                                          ) : (
                                            <input
                                              autoFocus
                                              type="text"
                                              value={edit.draft}
                                              disabled={saving}
                                              onChange={(event) =>
                                                setEdit((current) =>
                                                  current
                                                    ? {
                                                        ...current,
                                                        draft: event.target.value,
                                                      }
                                                    : current,
                                                )
                                              }
                                              onKeyDown={(event) => {
                                                if (event.key === 'Escape') {
                                                  event.preventDefault()
                                                  cancelEdit()
                                                }
                                                if (event.key === 'Enter') {
                                                  event.preventDefault()
                                                  saveEdit()
                                                }
                                              }}
                                              className="w-full min-w-[12rem] rounded border border-border-subtle bg-surface-container-lowest px-2 py-1 font-metadata text-metadata text-on-surface outline-none focus:border-primary"
                                            />
                                          )}
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              disabled={saving}
                                              onClick={saveEdit}
                                              className="font-metadata text-metadata text-primary hover:underline disabled:opacity-40"
                                            >
                                              {saving
                                                ? t('admin.saving')
                                                : t('admin.save')}
                                            </button>
                                            <button
                                              type="button"
                                              disabled={saving}
                                              onClick={cancelEdit}
                                              className="font-metadata text-metadata text-on-secondary-container hover:underline disabled:opacity-40"
                                            >
                                              {t('admin.cancel')}
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        formatCell(row[column])
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {tableData.total > PAGE_SIZE && (
                      <div className="mt-card-gap flex items-center justify-between gap-4">
                        <button
                          type="button"
                          disabled={page === 0}
                          onClick={() => setPage((current) => current - 1)}
                          className="rounded-md border border-border-subtle px-3 py-1.5 font-metadata text-metadata text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t('admin.prevPage')}
                        </button>
                        <span className="font-metadata text-metadata text-on-secondary-container">
                          {t('admin.pageOf', { current: page + 1, total: totalPages })}
                        </span>
                        <button
                          type="button"
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage((current) => current + 1)}
                          className="rounded-md border border-border-subtle px-3 py-1.5 font-metadata text-metadata text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t('admin.nextPage')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : null}
          </section>

          {showAddRow && activeTable && tableData ? (
            <AddRowModal
              table={activeTable}
              columns={tableData.columns.filter(
                (column) => !(tableData.auto_columns ?? []).includes(column),
              )}
              comments={tableData.column_comments}
              types={tableData.column_types}
              requiredColumns={tableData.required_columns}
              foreignKeys={tableData.foreign_keys}
              columnOptions={tableData.column_options}
              onClose={() => setShowAddRow(false)}
              onCreated={async () => {
                setShowAddRow(false)
                setSelected({})
                setConfirmDelete(false)
                setEdit(null)
                if (page !== 0) {
                  setPage(0)
                  return
                }
                try {
                  const refreshed = await fetchAdminTable(activeTable, {
                    limit: PAGE_SIZE,
                    offset: 0,
                  })
                  setTableData(refreshed)
                } catch (err) {
                  setError(err.message ?? t('admin.loadError'))
                }
              }}
            />
          ) : null}

          {commentColumn && activeTable && tableData ? (
            <ColumnCommentModal
              table={activeTable}
              column={commentColumn}
              comment={tableData.column_comments?.[commentColumn] ?? null}
              onClose={() => setCommentColumn(null)}
              onSaved={(nextComment) => {
                setTableData((current) => {
                  if (!current) return current
                  return {
                    ...current,
                    column_comments: {
                      ...(current.column_comments ?? {}),
                      [commentColumn]: nextComment,
                    },
                  }
                })
              }}
            />
          ) : null}
        </>
      )}
    </>
  )
}

function PlaceholderPanel({ messageKey }) {
  const { t } = useTranslation()

  return (
    <p className="font-body-base text-body-base text-on-secondary-container opacity-65">
      {t(messageKey)}
    </p>
  )
}

export default function AdminPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { section } = useParams()
  const activeSection = MAIN_TABS.includes(section) ? section : 'database'

  function selectSection(nextSection) {
    navigate(`/admin/${nextSection}`)
  }

  return (
    <main className="mx-auto w-full max-w-content flex-1 px-container-padding py-section-gap">
      <header className="mb-section-gap">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {t('admin.title')}
        </h1>

        <div
          className="mt-card-gap flex flex-wrap gap-2 border-b border-border-subtle"
          role="tablist"
          aria-label={t('admin.tabsLabel')}
        >
          {MAIN_TABS.map((tab) => {
            const isActive = tab === activeSection
            return (
              <button
                key={tab}
                id={`admin-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`admin-panel-${tab}`}
                onClick={() => selectSection(tab)}
                className={tabClass(isActive)}
              >
                {t(`admin.${tab}.label`)}
              </button>
            )
          })}
        </div>

        <p className="mt-card-gap font-body-base text-body-base text-on-secondary-container opacity-65">
          {t(`admin.${activeSection}.subtitle`)}
        </p>
      </header>

      <div
        id={`admin-panel-${activeSection}`}
        role="tabpanel"
        aria-labelledby={`admin-tab-${activeSection}`}
      >
        {activeSection === 'database' ? (
          <DatabasePanel />
        ) : activeSection === 'docs' ? (
          <PlaceholderPanel messageKey="admin.docs.placeholder" />
        ) : (
          <PlaceholderPanel messageKey="admin.settings.placeholder" />
        )}
      </div>
    </main>
  )
}
