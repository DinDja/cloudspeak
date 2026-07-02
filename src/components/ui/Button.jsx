const VARIANTS = {
  primary:
    'bg-[#E2FF32] text-[#09090B] hover:bg-[#d4f01e] rounded-none',
  solid:
    'bg-[#09090B] text-white hover:bg-[#27272a] rounded-none',
  ocean:
    'bg-[#0055FF] text-white hover:bg-[#0044dd] rounded-none',
  ghost:
    'bg-transparent text-[#09090B] hover:bg-[#F4F4F0] rounded-none',
  outline:
    'bg-white text-[#09090B] hover:bg-[#F4F4F0] rounded-none',
  subtle:
    'bg-[#F4F4F0] text-[#09090B] hover:bg-[#e8e8e3] rounded-none',
  danger:
    'bg-[#FF0055] text-white hover:bg-[#dd0049] rounded-none',
  dangerSoft:
    'bg-white text-[#FF0055] hover:bg-[#FFF0F3] rounded-none',
  neo:
    'bg-[#FCFBF9] text-[#09090B] hover:bg-[#F4F4F0] rounded-none',
}

const SIZES = {
  sm: 'h-10 px-4 text-sm gap-2',
  md: 'h-12 px-5 text-sm gap-2.5',
  lg: 'h-14 px-7 text-base gap-3',
  xl: 'h-16 px-8 text-lg gap-3.5',
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
        'inline-flex items-center justify-center font-bold tracking-tight uppercase border-[3px] border-[#09090B] transition-all duration-100',
        'outline-none shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant] ?? VARIANTS.solid,
        SIZES[size] ?? SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? <span className="h-5 w-5 animate-spin"><IconSpinner /></span> : Icon ? <Icon className="h-5 w-5" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-5 w-5" /> : null}
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
