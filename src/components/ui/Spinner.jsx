import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 'md', label, className = '' }) {
  const dim = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  return (
    <span className={['inline-flex items-center gap-3 text-slate-500', className].join(' ')}>
      <Loader2 className={`${dim} animate-spin text-brand-600`} />
      {label && <span className="font-bold tracking-tight text-slate-700">{label}</span>}
    </span>
  )
}

export function FullPageLoader({ label = 'Carregando...' }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
      <Spinner size="lg" label={label} />
    </div>
  )
}
