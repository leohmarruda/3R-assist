const variants = {
  primary:
    'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]',
  secondary:
    'border border-border-emphasis bg-surface-container-lowest text-on-surface hover:bg-surface-container',
  ghost: 'text-on-secondary-container hover:text-primary',
}

const sizes = {
  md: 'px-6 py-2.5 font-label-caps text-label-caps',
  sm: 'px-4 py-2 font-nav-link text-nav-link',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md transition-all duration-ethos disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
