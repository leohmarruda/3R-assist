const threeRStyles = {
  replacement: {
    badge: 'bg-replacement-bg text-replacement-text border-replacement-border',
    accent: 'text-replacement-text',
  },
  reduction: {
    badge: 'bg-reduction-bg text-reduction-text border-reduction-border',
    accent: 'text-reduction-text',
  },
  refinement: {
    badge: 'bg-refinement-bg text-refinement-text border-refinement-border',
    accent: 'text-refinement-text',
  },
}

export default function ResultCard({
  type = 'replacement',
  badgeLabel,
  title,
  score,
  jurisdiction = 'Brasil / Intl.',
  dimmed = false,
  validationStatus,
  oecdTgRef,
  matchedParams = [],
  description,
  primaryUrl,
  regulatoryUrl,
  matchedParamsLabel,
  sourcesLabel,
  regulatoryLinkLabel = 'OECD / regulatory',
  matchLabel = 'Match',
}) {
  const styles = threeRStyles[type] ?? threeRStyles.replacement

  const regulatoryLinkText = oecdTgRef
    ? `${regulatoryLinkLabel} (${oecdTgRef})`
    : regulatoryLinkLabel

  return (
    <article
      className={`rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding transition-colors duration-ethos hover:border-border-emphasis ${dimmed ? 'opacity-65' : ''}`}
    >
      <div className="mb-4 flex items-start justify-between gap-card-gap">
        <span
          className={`rounded border px-2 py-0.5 font-badge-button text-badge-button uppercase tracking-tight ${styles.badge}`}
        >
          {badgeLabel ?? type}
        </span>
        <span className="shrink-0 text-right font-metadata text-metadata text-text-tertiary">
          {matchLabel}{' '}
          <span className="font-monospace-data text-monospace-data">{score}%</span>
        </span>
      </div>
      <h3 className="mb-2 font-card-title text-card-title text-primary">{title}</h3>
      {description && (
        <p className="mb-3 font-body-base text-body-base text-on-secondary-container">
          {description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-fine-gap">
        <span className="rounded border border-info-border bg-info-bg px-2 py-0.5 font-badge-button text-badge-button text-info-text">
          {jurisdiction}
        </span>
        {validationStatus && (
          <span className={`font-metadata text-metadata font-medium ${styles.accent}`}>
            {validationStatus}
          </span>
        )}
      </div>
      {matchedParams.length > 0 && (
        <p className="mt-3 font-metadata text-metadata text-on-surface-variant">
          {matchedParamsLabel}: {matchedParams.join(', ')}
        </p>
      )}
      {(primaryUrl || regulatoryUrl) && (
        <div className="mt-3 flex flex-wrap gap-card-gap font-metadata text-metadata">
          {primaryUrl && (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {sourcesLabel}
            </a>
          )}
          {regulatoryUrl && (
            <a
              href={regulatoryUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {regulatoryLinkText}
            </a>
          )}
        </div>
      )}
    </article>
  )
}
