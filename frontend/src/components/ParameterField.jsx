import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const inputClass = (incomplete) =>
  `w-full rounded-lg border bg-surface-container-lowest px-container-padding py-2 font-body-base text-body-base text-on-surface outline-none transition-colors duration-ethos focus:border-primary ${
    incomplete
      ? 'border-reduction-border bg-reduction-bg/30'
      : 'border-border-emphasis'
  }`

const confidenceStyles = {
  high: 'border-border-emphasis bg-surface-container-low text-on-secondary-container',
  medium: 'border-amber-500/50 bg-amber-500/10 text-amber-900',
  low: 'border-reduction-border bg-reduction-bg text-reduction-text',
}

export function FieldConfidenceIndicator({ level }) {
  const { t } = useTranslation()

  if (!level) return null

  const hintKey = `s2.fieldConfidence.hint.${level}`

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-2 py-0.5 font-metadata text-metadata ${confidenceStyles[level] ?? confidenceStyles.medium}`}
      title={t(hintKey, { defaultValue: '' }) || undefined}
    >
      {t(`s2.fieldConfidence.level.${level}`)}
    </span>
  )
}

export function EvidenceToggle({ evidence, fieldConfidence }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  if (!evidence && !fieldConfidence) return null

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <FieldConfidenceIndicator level={fieldConfidence} />
        {evidence && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="ml-auto font-metadata text-metadata text-primary underline decoration-border-emphasis underline-offset-2 transition-colors hover:decoration-primary"
          >
            {visible ? t('s2.hideEvidence') : t('s2.showEvidence')}
          </button>
        )}
      </div>
      {visible && evidence && (
        <p className="rounded-lg border-l-2 border-primary bg-surface-container-low px-card-gap py-2 font-metadata text-metadata text-on-secondary-container">
          {evidence}
        </p>
      )}
    </div>
  )
}

export default function ParameterField({
  labelKey,
  value,
  onChange = () => {},
  incomplete = false,
  id,
  type = 'text',
  options = [],
  enumPrefix,
  hintKey,
  allowEmpty = false,
  evidence,
  fieldConfidence,
  readOnly = false,
}) {
  const { t } = useTranslation()
  const displayValue = value ?? ''

  function renderInput() {
    if (readOnly) {
      return (
        <p
          id={id}
          className="rounded-lg border border-border-subtle bg-surface-container-low px-container-padding py-2 font-body-base text-body-base text-on-surface"
        >
          {displayValue || t('s2.emptyOption')}
        </p>
      )
    }

    if (type === 'select') {
      return (
        <select
          id={id}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(incomplete)}
        >
          {allowEmpty && <option value="">{t('s2.emptyOption')}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {t(`s2.enums.${enumPrefix}.${option}`)}
            </option>
          ))}
        </select>
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={id}
          rows={3}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass(incomplete)} resize-y`}
        />
      )
    }

    if (type === 'number') {
      return (
        <input
          id={id}
          type="number"
          min="0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(incomplete)}
        />
      )
    }

    if (type === 'boolean') {
      return (
        <select
          id={id}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(incomplete)}
        >
          <option value="">{t('s2.emptyOption')}</option>
          <option value="true">{t('s2.boolean.yes')}</option>
          <option value="false">{t('s2.boolean.no')}</option>
        </select>
      )
    }

    if (type === 'routes') {
      return (
        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={displayValue ? undefined : t('s2.hints.route')}
          className={`${inputClass(incomplete)} font-monospace-data text-monospace-data`}
        />
      )
    }

    return (
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(incomplete)}
      />
    )
  }

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="font-small-label text-small-label uppercase text-on-surface-variant opacity-65"
      >
        {t(labelKey)}
      </label>
      {renderInput()}
      {hintKey && type !== 'routes' && !readOnly && (
        <p className="font-metadata text-metadata text-text-tertiary">
          {t(hintKey)}
        </p>
      )}
      <EvidenceToggle evidence={evidence} fieldConfidence={fieldConfidence} />
    </div>
  )
}
