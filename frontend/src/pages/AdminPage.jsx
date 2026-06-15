import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchAdminTable, fetchAdminTables } from '../lib/admin'

const PAGE_SIZE = 10

function formatCell(value) {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

export default function AdminPage() {
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
    navigate(`/admin#${table}`, { replace: true })
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

  const totalPages = tableData ? Math.max(1, Math.ceil(tableData.total / PAGE_SIZE)) : 1

  return (
    <main className="mx-auto w-full max-w-content flex-1 px-container-padding py-section-gap">
      <header className="mb-section-gap">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {t('admin.title')}
        </h1>
        <p className="mt-fine-gap font-body-base text-body-base text-on-secondary-container opacity-65">
          {t('admin.subtitle')}
        </p>
      </header>

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
            aria-label={t('admin.tabsLabel')}
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
                  className={
                    isActive
                      ? 'border-b-2 border-primary px-3 py-2 font-nav-link text-nav-link font-medium text-primary'
                      : 'px-3 py-2 font-nav-link text-nav-link text-on-secondary-container transition-colors hover:text-primary'
                  }
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
                <p className="mb-card-gap font-metadata text-metadata text-on-secondary-container">
                  {tableData.total === 0
                    ? t('admin.emptyTable')
                    : t('admin.rowCount', {
                        from: tableData.offset + 1,
                        to: tableData.offset + tableData.rows.length,
                        total: tableData.total,
                      })}
                </p>
                {tableData.rows.length === 0 ? null : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-max min-w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border-subtle">
                            {tableData.columns.map((column) => (
                              <th
                                key={column}
                                className="whitespace-nowrap px-3 py-2 font-label-caps text-label-caps uppercase text-on-surface-variant"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle font-metadata text-metadata">
                          {tableData.rows.map((row, index) => (
                            <tr key={`${activeTable}-${tableData.offset + index}`}>
                              {tableData.columns.map((column) => (
                                <td
                                  key={column}
                                  className="whitespace-nowrap px-3 py-2 align-top text-on-surface"
                                >
                                  {formatCell(row[column])}
                                </td>
                              ))}
                            </tr>
                          ))}
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
        </>
      )}
    </main>
  )
}
