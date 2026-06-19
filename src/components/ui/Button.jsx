import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-brand-gradient text-white shadow-soft hover:shadow-float hover:-translate-y-0.5 focus-visible:ring-brand-600',
  solid:
    'bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:-translate-y-0.5 focus-visible:ring-brand-600',
  ocean:
    'bg-ocean-gradient text-white shadow-soft hover:-translate-y-0.5 focus-visible:ring-ocean-500',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
  outline:
    'bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 focus-visible:ring-slate-400',
  subtle:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-300',
  danger:
    'bg-rose-600 text-white shadow-soft hover:bg-rose-700 focus-visible:ring-rose-600',
  dangerSoft:
    'bg-rose-50 text-rose-600 hover:bg-rose-100 focus-visible:ring-rose-300',
}

const SIZES = {
  sm: 'h-9 px-4 text-sm gap-2 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-14 px-6 text-base gap-2.5 rounded-2xl',
  xl: 'h-16 px-8 text-lg gap-3 rounded-2xl',
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
        'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200',
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none',
        VARIANTS[variant] ?? VARIANTS.solid,
        SIZES[size] ?? SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : Icon ? <Icon className="h-5 w-5" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-5 w-5" /> : null}
    </Component>
  )
}
