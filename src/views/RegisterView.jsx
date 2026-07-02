import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react'
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
      title="Crie sua conta"
      subtitle="Acesso exclusivo para servidores @secti.ba.gov.br."
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onGoLogin}
          className="inline-flex items-center gap-1.5 border-2 border-transparent px-2 py-1 text-xs font-black uppercase tracking-widest text-[#09090B] transition-all duration-100 hover:border-[#09090B] hover:bg-[#E2FF32] hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Já tem conta? Entrar
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Como devemos te chamar?" icon={User}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome completo"
            maxLength={60}
            className="cs-input-base w-full py-4 pl-12 pr-4 text-base font-bold"
          />
        </Field>
        <Field label="E-mail institucional" icon={Mail}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@secti.ba.gov.br"
            type="email"
            autoCapitalize="none"
            autoCorrect="off"
            className="cs-input-base w-full py-4 pl-12 pr-4 text-base font-bold"
          />
        </Field>
        <Field label="Senha" icon={Lock}>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mín. 6 caracteres"
            type="password"
            className="cs-input-base w-full py-4 pl-12 pr-4 text-base font-bold"
          />
        </Field>

        {error && (
          <motion.p
            className="border-[3px] border-[#09090B] bg-[#FF0055] px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0px_0px_#09090B]"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="cs-btn-base h-14 w-full gap-2 bg-[#E2FF32] text-base font-black text-[#09090B] hover:bg-[#d4f01e]"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Criar minha conta <ArrowRight className="h-5 w-5" /></>}
        </button>

        <p className="text-center text-xs font-black uppercase tracking-wider text-slate-500">
          Ao continuar você concorda com o uso dos dados conforme LGPD.
        </p>
      </form>
    </AuthLayout>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 my-auto text-slate-400">
          <Icon className="h-5 w-5" />
        </div>
        {children}
      </div>
    </div>
  )
}
