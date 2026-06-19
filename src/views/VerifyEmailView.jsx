import { useState } from 'react'
import { MailCheck, RefreshCw, LogOut, ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'

export default function VerifyEmailView({ onBackToPublic }) {
  const { email, resend, refresh, logout } = useAuth()
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')

  const handleResend = async () => {
    setSending(true)
    setMessage('')
    try {
      await resend()
      setMessage('E-mail de verificação reenviado. Verifique sua caixa de entrada.')
    } catch {
      setMessage('Não foi possível reenviar. Aguarde um momento e tente novamente.')
    } finally {
      setSending(false)
    }
  }

  const handleRefresh = async () => {
    setChecking(true)
    setMessage('')
    try {
      await refresh()
      setMessage('Status atualizado. Se você verificou, o acesso será liberado.')
    } catch {
      setMessage('Não foi possível atualizar o status agora.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <AuthLayout
      title="Confirme seu e-mail"
      subtitle="Enviamos um link de verificação para o seu endereço @secti.ba.gov.br."
      onBack={onBackToPublic}
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center rounded-3xl bg-brand-50 px-6 py-8 text-center ring-1 ring-brand-100">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm font-bold text-brand-800">{email}</p>
          <p className="mt-2 max-w-xs text-sm font-medium text-slate-600">
            Clique no link que enviamos para liberar o acesso ao estúdio.
          </p>
        </div>

        {message && (
          <p className="rounded-xl bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-600">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={checking}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-gradient py-4 text-base font-black text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float active:scale-[0.98] disabled:opacity-50"
        >
          {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          Já verifiquei — atualizar
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4 rotate-180" />}
            Reenviar e-mail
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
