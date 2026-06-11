import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ParameterField from '../components/ParameterField'
import {
  emptyParameterKeys,
  normalizeFieldConfidence,
  PARAMETER_FIELDS,
} from '../lib/protocol'

function normalizeParams(params) {
  return Object.fromEntries(
    PARAMETER_FIELDS.map(({ key }) => [key, params?.[key] ?? '']),
  )
}

export default function ParametersPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const analysis = location.state

  const [params, setParams] = useState(() =>
    normalizeParams(analysis?.params ?? {}),
  )

  if (!analysis?.params) {
    return <Navigate to="/" replace />
  }

  const fieldConfidence = normalizeFieldConfidence(
    analysis.fieldConfidence,
    params,
  )
  const incompleteKeys = new Set(emptyParameterKeys(params))

  function updateField(key, value) {
    setParams((current) => ({ ...current, [key]: value }))
  }

  function handleSearch() {
    navigate('/resultados', {
      state: {
        params,
        protocolText: analysis.protocolText,
        lang: analysis.lang,
        confidence: analysis.confidence,
        fieldConfidence,
      },
    })
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-container-padding py-section-gap">
      <div className="mb-section-gap">
        <Link
          to="/"
          state={{
            protocolText: analysis.protocolText,
            lang: analysis.lang,
          }}
          className="font-nav-link text-nav-link text-on-secondary-container transition-colors hover:text-primary"
        >
          ← {t('s2.backToEdit')}
        </Link>
      </div>

      <header className="mb-section-gap">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {t('s2.title')}
        </h1>
        <p className="mt-fine-gap font-body-base text-body-base text-on-secondary-container opacity-65">
          {t('s2.subtitle')}
        </p>
      </header>

      <section className="space-y-card-gap rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding">
        {PARAMETER_FIELDS.map(({ key, labelKey }) => (
          <ParameterField
            key={key}
            id={`param-${key}`}
            labelKey={labelKey}
            value={params[key]}
            onChange={(value) => updateField(key, value)}
            incomplete={incompleteKeys.has(key)}
            confidence={fieldConfidence[key]}
          />
        ))}

        {incompleteKeys.size > 0 && (
          <p
            className="font-metadata text-metadata text-reduction-text"
            role="status"
          >
            {t('s2.incompleteWarning')}
          </p>
        )}
      </section>

      <div className="mt-section-gap flex justify-end">
        <Button type="button" onClick={handleSearch}>
          {t('s2.searchCta')}
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </main>
  )
}
