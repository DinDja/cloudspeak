import { useState } from 'react'
import { KeyRound, Play, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import Logo from '../components/ui/Logo'
import SectiMark from '../components/ui/SectiMark'
import WaveBackground from '../components/ui/WaveBackground'
import { isValidSessionCode } from '../lib/validators'

export default function PublicLanding({ initialCode = '', onJoin, onPresenterLogin, loading, error }) {
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')

  const canJoin = isValidSessionCode(code.trim())

  const submit = (event) => {
    event.preventDefault()
    if (!canJoin) return
    onJoin(name, code.trim())
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden font-sans text-slate-900">
      <WaveBackground variant="light" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md cs-slide-up">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size="lg" />
            <p className="mt-4 max-w-xs text-sm font-semibold text-slate-500">
              Plataforma de apresentações interativas da SECTI.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="rounded-5xl bg-white/85 p-7 shadow-float ring-1 ring-white/60 backdrop-blur-xl sm:p-8"
          >
            <p className="mb-6 text-center text-base font-bold text-slate-700">
              Entre na apresentação pelo código exibido na tela.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute inset-y-0 left-4 my-auto h-5 w-5 text-slate-400" />
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Código da sala"
                  inputMode="text"
                  autoCapitalize="characters"
                  className="w-full rounded-2xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-center text-2xl font-black tracking-[0.3em] text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-brand-600"
                />
              </div>
              <div className="relative">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome (opcional)"
                  maxLength={40}
                  className="w-full rounded-2xl border-0 bg-slate-50 py-3.5 px-4 text-base font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !canJoin}
                className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-gradient py-4 text-lg font-black text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
                Entrar na Sessão
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-center text-sm font-bold text-rose-600">
                {error}
              </p>
            )}
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onPresenterLogin}
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-brand-600"
            >
              <ShieldCheck className="h-4 w-4 text-slate-400 transition-colors group-hover:text-brand-500" />
              Sou apresentador
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <SectiMark height="h-8" className="opacity-70" />
          </div>
        </div>
      </div>
    </div>
  )
}
