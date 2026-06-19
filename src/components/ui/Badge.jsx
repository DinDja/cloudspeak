const TONES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  ocean: 'bg-ocean-50 text-ocean-700 ring-ocean-100',
  gold: 'bg-gold-50 text-gold-600 ring-gold-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  live: 'bg-ocean-500 text-white ring-ocean-600',
}

export default function Badge({ tone = 'slate', className = '', children, dot = false }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset',
        TONES[tone] ?? TONES.slate,
        className,
      ].join(' ')}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
