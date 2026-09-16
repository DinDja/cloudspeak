const VARIANTS = {
  primary: 'bg-[#6843a1] text-white hover:bg-[#52337f]',
  solid: 'bg-slate-900 text-white hover:bg-slate-800',
  ocean: 'bg-emerald-700 text-white hover:bg-emerald-800',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  outline: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  dangerSoft: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  neo: 'bg-white text-slate-700 hover:bg-slate-50',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2.5',
  xl: 'h-12 px-6 text-base gap-3',
}

export default function Button({
  as,
  variant = 'solid',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  const Component = as || 'button'
  const isDisabled = disabled || loading

  return (
    <Component
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-lg border font-semibold transition-colors duration-150 outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant] ?? VARIANTS.solid,
        SIZES[size] ?? SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin"><IconSpinner /></span> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4" /> : null}
    </Component>
  )
}

function IconSpinner({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M21 12a9 9 0 01-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}
