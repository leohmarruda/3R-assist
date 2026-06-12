import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ParameterField from '../components/ParameterField'
import {
  DISPLAY_FIELDS,
  emptyParameterKeys,
  MATCHING_FIELDS,
  normalizeFieldConfidence,
  normalizeParams,
  serializeParams,
} from '../lib/protocol'

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
        params: serializeParams(params),
        protocolText: analysis.protocolText,
        lang: analysis.lang,
        confidence: analysis.confidence,
        fieldConfidence,
        rawTextExcerpt: analysis.rawTextExcerpt,
        isMock: analysis.isMock,
      },
    })
  }

  function renderFields(fields) {
    return fields.map(
      ({ key, labelKey, type, options, enumPrefix, hintKey, allowEmpty }) => (
        <ParameterField
          key={key}
          id={`param-${key}`}
          labelKey={labelKey}
          type={type}
          options={options}
          enumPrefix={enumPrefix}
          hintKey={hintKey}
          allowEmpty={allowEmpty}
          value={params[key]}
          onChange={(value) => updateField(key, value)}
          incomplete={incompleteKeys.has(key)}
          confidence={fieldConfidence[key]}
        />
      ),
    )
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

      <header className="mb-card-gap">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {t('s2.title')}
        </h1>
        <p className="mt-fine-gap font-body-base text-body-base text-on-secondary-container opacity-65">
          {t('s2.subtitle')}
        </p>
      </header>

      <div className="space-y-section-gap">
        <section className="space-y-card-gap rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding">
          {analysis.rawTextExcerpt && (
            <p className="rounded-lg border border-border-subtle bg-surface-container-low px-card-gap py-3 font-metadata text-metadata text-on-secondary-container">
              <span className="font-medium text-on-surface">
                {t('s2.excerptLabel')}:{' '}
              </span>
              {analysis.rawTextExcerpt}
            </p>
          )}

          <div className="space-y-card-gap">
            <h2 className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              {t('s2.displaySection')}
            </h2>
            {renderFields(DISPLAY_FIELDS)}
          </div>

          <div className="space-y-card-gap">
            <h2 className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              {t('s2.matchingSection')}
            </h2>
            {renderFields(MATCHING_FIELDS)}
          </div>
        </section>

        {incompleteKeys.size > 0 && (
          <p
            className="font-metadata text-metadata text-reduction-text"
            role="status"
          >
            {t('s2.incompleteWarning')}
          </p>
        )}
      </div>

      <div className="mt-section-gap flex justify-end">
        <Button type="button" onClick={handleSearch}>
          {t('s2.searchCta')}
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </main>
  )
}
