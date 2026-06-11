const options = [
  { value: 'pt', label: 'PT' },
  { value: 'en', label: 'EN' },
]

export default function LangToggle({ value, onChange }) {
  return (
    <div
      className="flex items-center rounded bg-surface-container-high p-0.5"
      role="group"
      aria-label="Protocol language"
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={
              active
                ? 'rounded bg-surface-container-lowest px-3 py-1 font-badge-button text-badge-button text-primary transition-all'
                : 'rounded px-3 py-1 font-badge-button text-badge-button text-on-secondary-container transition-all hover:text-primary'
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
