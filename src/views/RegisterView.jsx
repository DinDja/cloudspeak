import { useState } from 'react'
import { Mail, Lock, User, Loader2, UserPlus } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { isSectiEmail, describeAuthError } from '../lib/validators'
import { AuthErrorCode } from '../lib/firebaseAuth'

export default function RegisterView({ onBack, onGoLogin }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Informe seu nome.')
      return
    }
    if (!isSectiEmail(email.trim())) {
      setError('Cadastre-se apenas com e-mail @secti.ba.gov.br.')
      return
    }
    if (!password || password.length < 6) {
      setError('A senha precisa ter ao menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
    } catch (err) {
      if (err.code === AuthErrorCode.NOT_SECTI) {
        setError('Cadastre-se apenas com e-mail @secti.ba.gov.br.')
      } else {
        setError(err.message || describeAuthError(err.code))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Cadastro exclusivo para servidores @secti.ba.gov.br."
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onGoLogin}
          className="text-sm font-bold text-slate-500 transition-colors hover:text-brand-600"
        >
          Já tem conta? Entrar
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <User className="pointer-events-none absolute inset-y-0 left-4 my-auto h-5 w-5 text-slate-400" />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
            maxLength={60}
            className="w-full rounded-2xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-base font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
          />
        </div>
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
            placeholder="Senha (mín. 6 caracteres)"
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
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          Criar conta
        </button>
      </form>
    </AuthLayout>
  )
}
