import { useTranslation } from 'react-i18next'
import ConfidenceBadge from './ConfidenceBadge'

const inputClass = (incomplete) =>
  `w-full rounded-lg border bg-surface-container-lowest px-container-padding py-2 font-body-base text-body-base text-on-surface outline-none transition-colors duration-ethos focus:border-primary ${
    incomplete
      ? 'border-reduction-border bg-reduction-bg/30'
      : 'border-border-emphasis'
  }`

export default function ParameterField({
  labelKey,
  value,
  onChange,
  incomplete = false,
  confidence,
  id,
  type = 'text',
  options = [],
  enumPrefix,
  hintKey,
  allowEmpty = false,
}) {
  const { t } = useTranslation()

  function renderInput() {
    if (type === 'select') {
      return (
        <select
          id={id}
          value={value}
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
          value={value}
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(incomplete)}
        />
      )
    }

    if (type === 'boolean') {
      return (
        <select
          id={id}
          value={value}
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('s2.hints.route')}
          className={`${inputClass(incomplete)} font-monospace-data text-monospace-data`}
        />
      )
    }

    return (
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(incomplete)}
      />
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-fine-gap">
        <label
          htmlFor={id}
          className="font-small-label text-small-label uppercase text-on-surface-variant opacity-65"
        >
          {t(labelKey)}
        </label>
        <ConfidenceBadge level={confidence} />
      </div>
      {renderInput()}
      {hintKey && type !== 'routes' && (
        <p className="font-metadata text-metadata text-text-tertiary">
          {t(hintKey)}
        </p>
      )}
    </div>
  )
}
