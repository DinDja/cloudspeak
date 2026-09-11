export default function WaveBackground({ variant = 'light', className = '' }) {
  const isDark = variant === 'dark'

  return (
    <div className={['pointer-events-none absolute inset-0 z-0 overflow-hidden', className].join(' ')} aria-hidden="true">
      <div className={isDark ? 'absolute inset-0 bg-slate-950' : 'absolute inset-0 bg-slate-50'} />
      <div className={isDark ? 'absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl' : 'absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl'} />
      <div className={isDark ? 'absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-slate-800/40 blur-3xl' : 'absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl'} />
    </div>
  )
}
