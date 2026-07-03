import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        <motion.div
          className="relative overflow-hidden border-[3px] border-[#09090B] bg-white p-6 text-center shadow-[6px_6px_0px_0px_#09090B]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-[#09090B] bg-[#09090B] text-white shadow-[3px_3px_0px_0px_#09090B]">
              <Inbox className="h-7 w-7" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enviamos para</p>
            <p className="mt-1 text-sm font-black text-[#09090B]">{email}</p>
            <p className="mt-3 mx-auto max-w-xs text-sm font-bold text-slate-600">
              Clique no link recebido para liberar o acesso ao estúdio.
            </p>
          </div>
        </motion.div>

        <AnimatePresence>
          {message && (
            <motion.p
              className={`border-[3px] border-[#09090B] px-4 py-3 text-center text-sm font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#09090B] ${
                messageTone === 'success'
                  ? 'bg-emerald-300 text-slate-900'
                  : messageTone === 'error'
                    ? 'bg-rose-400 text-white'
                    : 'bg-slate-200 text-slate-800'
              }`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={checking}
          className="cs-btn-base h-14 w-full gap-2 bg-[#E2FF32] text-base font-black text-[#09090B] hover:bg-[#d4f01e]"
        >
          {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <><RefreshCw className="h-5 w-5" /> Já verifiquei — atualizar</>}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="cs-btn-base h-12 gap-2 bg-white px-4 text-sm font-bold text-[#09090B] hover:bg-[#F4F4F0]"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Reenviar
          </button>
          <button
            type="button"
            onClick={logout}
            className="cs-btn-base h-12 gap-2 bg-[#FF0055] px-4 text-sm font-bold text-white hover:bg-[#dd0049]"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        <div className="flex items-center gap-2 border-2 border-[#09090B] bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-[#09090B] shadow-[2px_2px_0px_0px_#09090B]">
          Dica: o e-mail pode cair na sua pasta de spam.
        </div>
      </div>
    </AuthLayout>
  )
}
