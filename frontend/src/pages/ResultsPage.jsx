import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { PARAMETER_FIELDS } from '../lib/protocol'

export default function ResultsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { params } = location.state ?? {}

  if (!params) {
    return <Navigate to="/" replace />
  }

  const summary = PARAMETER_FIELDS.map(({ key }) => params[key])
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-container-padding py-section-gap">
      <header className="mb-section-gap">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {t('s3.placeholderTitle')}
        </h1>
        {summary && (
          <p className="mt-fine-gap font-metadata text-metadata text-on-secondary-container">
            {summary}
          </p>
        )}
      </header>

      <section className="rounded-lg border border-border-subtle bg-surface-container-low p-container-padding">
        <p className="font-body-base text-body-base text-on-secondary-container">
          {t('s3.placeholderBody')}
        </p>
        <Link
          to="/parametros"
          state={location.state}
          className="mt-card-gap inline-block font-nav-link text-nav-link text-primary underline decoration-border-emphasis underline-offset-2 hover:decoration-primary"
        >
          ← {t('s2.backToParams')}
        </Link>
      </section>
    </main>
  )
}
