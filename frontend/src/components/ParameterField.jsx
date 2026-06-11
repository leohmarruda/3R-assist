import { useTranslation } from 'react-i18next'

export default function ParameterField({
  labelKey,
  value,
  onChange,
  incomplete = false,
  id,
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="font-small-label text-small-label uppercase text-on-surface-variant opacity-65"
      >
        {t(labelKey)}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-surface-container-lowest px-container-padding py-2 font-body-base text-body-base text-on-surface outline-none transition-colors duration-ethos focus:border-primary ${
          incomplete
            ? 'border-reduction-border bg-reduction-bg/30'
            : 'border-border-emphasis'
        }`}
      />
    </div>
  )
}
