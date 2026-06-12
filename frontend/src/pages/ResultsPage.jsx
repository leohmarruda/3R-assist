import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router-dom'
import ReportSection from '../components/ReportSection'
import { MOCK_ASSESSMENT_REPORT } from '../lib/mockAssessmentReport'

export default function ResultsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { params } = location.state ?? {}
  const report = MOCK_ASSESSMENT_REPORT

  if (!params) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="mx-auto w-full max-w-content flex-1 px-container-padding py-section-gap">
      <div className="mb-card-gap">
        <Link
          to="/parameters"
          state={location.state}
          className="font-nav-link text-nav-link text-on-secondary-container transition-colors hover:text-primary"
        >
          ← {t('s2.backToParams')}
        </Link>
      </div>

      <header className="mb-section-gap">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {report.title}
        </h1>
        <div className="mt-card-gap overflow-hidden rounded-lg border border-border-subtle bg-surface-container-lowest">
          <table className="w-full border-collapse text-left">
            <tbody className="divide-y divide-border-subtle font-body-base text-body-base">
              {report.meta.map((row) => (
                <tr key={row.label}>
                  <th className="w-48 bg-surface-container-low px-container-padding py-3 text-left font-label-caps text-label-caps uppercase text-on-surface-variant">
                    {row.label}
                  </th>
                  <td className="px-container-padding py-3">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>

      <div className="space-y-section-gap">
        {report.sections.map((section) => (
          <ReportSection key={section.id} section={section} />
        ))}
      </div>

      <section className="mt-section-gap rounded-lg border border-border-subtle bg-surface-container-low p-container-padding">
        <h2 className="mb-card-gap font-label-caps text-label-caps uppercase text-on-surface-variant">
          {t('s3.summaryRecommendation')}
        </h2>
        <p className="font-body-base text-body-base text-on-surface">
          {report.summary}
        </p>
      </section>
    </main>
  )
}
