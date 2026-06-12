import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAdminTable, fetchAdminTables } from '../lib/admin'

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
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
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
        setActiveTable(result.tables[0] ?? null)
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
    if (!activeTable) {
      setTableData(null)
      return undefined
    }

    let cancelled = false

    async function loadTable() {
      setLoadingData(true)
      setError(null)
      try {
        const result = await fetchAdminTable(activeTable)
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
  }, [activeTable, t])

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
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTable(table)}
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
                  {t('admin.rowCount', {
                    shown: tableData.rows.length,
                    total: tableData.total,
                  })}
                </p>
                {tableData.rows.length === 0 ? (
                  <p className="font-body-base text-body-base text-on-secondary-container">
                    {t('admin.emptyTable')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left">
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
                          <tr key={`${activeTable}-${index}`}>
                            {tableData.columns.map((column) => (
                              <td
                                key={column}
                                className="max-w-xs truncate px-3 py-2 align-top text-on-surface"
                                title={formatCell(row[column])}
                              >
                                {formatCell(row[column])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : null}
          </section>
        </>
      )}
    </main>
  )
}
