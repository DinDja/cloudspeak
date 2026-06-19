import { useState } from 'react'
import { Mail, Lock, Loader2, LogIn } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { isSectiEmail, describeAuthError } from '../lib/validators'
import { AuthErrorCode } from '../lib/firebaseAuth'

export default function LoginView({ onBack, onGoRegister }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isSectiEmail(email.trim())) {
      setError('Use um e-mail @secti.ba.gov.br.')
      return
    }
    if (!password) {
      setError('Informe sua senha.')
      return
    }

    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      if (err.code === AuthErrorCode.NOT_SECTI) {
        setError('Use um e-mail @secti.ba.gov.br.')
      } else if (err.code === 'auth/email-not-verified') {
        setError('Confirme seu e-mail antes de continuar.')
      } else {
        setError(err.message || describeAuthError(err.code))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse o estúdio de apresentações."
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onGoRegister}
          className="text-sm font-bold text-slate-500 transition-colors hover:text-brand-600"
        >
          Não tem conta? Criar
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <Mail className="pointer-events-none absolute inset-y-0 left-4 my-auto h-5 w-5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@secti.ba.gov.br"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-2xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-base font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
          />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute inset-y-0 left-4 my-auto h-5 w-5 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            className="w-full rounded-2xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-base font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-gradient py-4 text-base font-black text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          Entrar
        </button>
      </form>
    </AuthLayout>
  )
}
