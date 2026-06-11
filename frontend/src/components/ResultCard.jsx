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
  title,
  score,
  jurisdiction = 'Brasil / Intl.',
  dimmed = false,
}) {
  const styles = threeRStyles[type]

  return (
    <article
      className={`rounded-lg border border-border-subtle bg-surface-container-lowest p-container-padding transition-colors duration-ethos hover:border-border-emphasis ${dimmed ? 'opacity-65' : ''}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <span
          className={`rounded border px-2 py-0.5 font-badge-button text-badge-button uppercase tracking-tight ${styles.badge}`}
        >
          {type}
        </span>
        <span className="font-monospace-data text-monospace-data text-text-tertiary">
          {score}%
        </span>
      </div>
      <h3 className="mb-2 font-card-title text-card-title text-primary">{title}</h3>
      <div className="flex flex-wrap items-center gap-fine-gap">
        <span className="rounded border border-info-border bg-info-bg px-2 py-0.5 font-badge-button text-badge-button text-info-text">
          {jurisdiction}
        </span>
        <span className={`font-metadata text-metadata font-medium ${styles.accent}`}>
          Validated
        </span>
      </div>
    </article>
  )
}
