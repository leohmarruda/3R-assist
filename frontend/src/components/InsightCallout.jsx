export default function InsightCallout({ children }) {
  return (
    <aside className="flex gap-gutter rounded-lg border border-info-border bg-info-bg p-card-gap">
      <span className="text-info-text" aria-hidden="true">
        💡
      </span>
      <div className="space-y-1">
        <h3 className="font-card-title text-card-title text-info-text">
          Tool Insight
        </h3>
        <p className="font-body-base text-body-base text-info-text opacity-90">
          {children}
        </p>
      </div>
    </aside>
  )
}
