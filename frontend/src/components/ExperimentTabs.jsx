import { useTranslation } from 'react-i18next'

export default function ExperimentTabs({
  tabs,
  activeIndex,
  onChange,
  count,
  hintKey = 's2.multiExperimentHint',
  tabsLabelKey = 's2.experimentTabsLabel',
  idPrefix = 'experiment',
}) {
  const { t } = useTranslation()

  if (tabs.length <= 1) {
    return null
  }

  return (
    <div className="space-y-card-gap">
      <p className="font-metadata text-metadata text-on-secondary-container">
        {t(hintKey, { count })}
      </p>
      <div
        role="tablist"
        aria-label={t(tabsLabelKey)}
        className="flex flex-wrap gap-fine-gap border-b border-border-subtle"
      >
        {tabs.map((label, index) => {
          const selected = activeIndex === index
          return (
            <button
              key={label + index}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel-${index}`}
              onClick={() => onChange(index)}
              className={`-mb-px max-w-full truncate rounded-t-md border px-3 py-2 font-metadata text-metadata transition-colors ${
                selected
                  ? 'border-border-subtle border-b-surface-container-lowest bg-surface-container-lowest text-primary'
                  : 'border-transparent text-on-secondary-container hover:border-border-subtle hover:text-primary'
              }`}
              title={label}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function experimentTabLabel(studyType, index, t) {
  const trimmed = studyType?.trim()
  if (trimmed) {
    return trimmed.length > 42 ? `${trimmed.slice(0, 39)}…` : trimmed
  }
  return t('s2.experimentTab', { number: index + 1 })
}
