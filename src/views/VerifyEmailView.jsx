import { useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import {
  MailCheck,
  RefreshCw,
  LogOut,
  Loader2,
  Send,
  Inbox,
} from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'

export default function VerifyEmailView({ onBackToPublic }) {
  const { email, resend, refresh, logout } = useAuth()
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')

  const handleResend = async () => {
    setSending(true)
    setMessage('')
    try {
      await resend()
      setMessageTone('success')
      setMessage('E-mail de verificação reenviado. Verifique sua caixa de entrada.')
    } catch {
      setMessageTone('error')
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
      setMessageTone('success')
      setMessage('Status atualizado. Se você verificou, o acesso será liberado em instantes.')
    } catch {
      setMessageTone('error')
      setMessage('Não foi possível atualizar o status agora.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <AuthLayout
      title="Confirme seu e-mail"
      subtitle="Estamos liberando seu estúdio assim que você clicar no link."
      onBack={onBackToPublic}
    >
      <div className="space-y-5">
        <Motion.div
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Inbox className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-slate-500">Enviamos para</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{email}</p>
            <p className="mt-3 mx-auto max-w-xs text-sm font-bold text-slate-600">
              Clique no link recebido para liberar o acesso ao estúdio.
            </p>
          </div>
        </Motion.div>

        <AnimatePresence>
          {message && (
            <Motion.p
              className={`rounded-lg border px-4 py-3 text-center text-sm ${
                messageTone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : messageTone === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {message}
            </Motion.p>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={checking}
          className="cs-btn-base h-11 w-full gap-2 text-sm"
        >
          {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <><RefreshCw className="h-5 w-5" /> Já verifiquei — atualizar</>}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="cs-btn-base h-11 gap-2 border-slate-200 !bg-white px-4 text-sm !text-slate-700 hover:!bg-slate-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Reenviar
          </button>
          <button
            type="button"
            onClick={logout}
            className="cs-btn-base h-11 gap-2 bg-red-700 px-4 text-sm hover:bg-red-800"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Dica: o e-mail pode cair na sua pasta de spam.
        </div>
      </div>
    </AuthLayout>
  )
}
