import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  buildHighlightSpans,
  splitTextWithHighlights,
} from '../lib/highlightEvidence'

export default function ProtocolTextPanel({ protocolText, evidence = {} }) {
  const { t } = useTranslation()

  const parts = useMemo(() => {
    const spans = buildHighlightSpans(protocolText, evidence)
    return splitTextWithHighlights(protocolText, spans)
  }, [protocolText, evidence])

  const hasHighlights = parts.some((part) => part.highlighted)

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding">
      <div className="mb-card-gap flex flex-wrap items-baseline justify-between gap-fine-gap">
        <h2 className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          {t('s2.protocolSourceLabel')}
        </h2>
        {hasHighlights && (
          <span className="font-metadata text-metadata text-on-surface-variant opacity-65">
            {t('s2.protocolHighlightLegend')}
          </span>
        )}
      </div>
      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto rounded-lg border border-border-emphasis bg-surface-container-low p-container-padding">
        <p className="whitespace-pre-wrap font-monospace-data text-monospace-data leading-relaxed text-on-secondary-container">
          {parts.map((part, index) =>
            part.highlighted ? (
              <mark
                key={index}
                className="rounded-sm bg-primary/15 px-0.5 text-on-surface ring-1 ring-primary/25"
              >
                {part.text}
              </mark>
            ) : (
              part.text
            ),
          )}
        </p>
      </div>
    </div>
  )
}
