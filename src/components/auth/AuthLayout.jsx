import { ArrowLeft, ShieldCheck } from 'lucide-react'
import Logo from '../ui/Logo'
import WaveBackground from '../ui/WaveBackground'

export default function AuthLayout({ title, subtitle, onBack, children, footer }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden font-sans text-slate-900">
      <WaveBackground variant="light" />

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md cs-slide-up">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo size="md" />
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
              <ShieldCheck className="h-4 w-4" /> Acesso restrito SECTI
            </div>
          </div>

          <div className="rounded-5xl bg-white/90 p-7 shadow-float ring-1 ring-white/60 backdrop-blur-xl sm:p-8">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm font-medium text-slate-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-brand-600"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            )}
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
