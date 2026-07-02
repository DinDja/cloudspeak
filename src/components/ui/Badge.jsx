const TONES = {
  brand: 'bg-brand-300 text-black',
  ocean: 'bg-ocean-300 text-black',
  sunset: 'bg-sunset-300 text-black',
  coral: 'bg-coral-300 text-black',
  violet: 'bg-violet-300 text-black',
  slate: 'bg-slate-300 text-black',
  live: 'bg-emerald-400 text-black',
}

export default function Badge({ tone = 'slate', className = '', children, dot = false }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-sm border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        TONES[tone] ?? TONES.slate,
        className,
      ].join(' ')}
    >
      {dot && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-20" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-black bg-black" />
        </span>
      )}
      {children}
    </span>
  )
}