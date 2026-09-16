const TONES = {
  brand: 'border-violet-200 bg-violet-50 text-violet-900',
  ocean: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  sunset: 'border-amber-100 bg-amber-50 text-amber-700',
  coral: 'border-red-100 bg-red-50 text-red-700',
  violet: 'border-violet-100 bg-violet-50 text-violet-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-600',
  live: 'border-emerald-100 bg-emerald-50 text-emerald-700',
}

export default function Badge({ tone = 'slate', className = '', children, dot = false }) {
  return (
    <span className={['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', TONES[tone] ?? TONES.slate, className].join(' ')}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
