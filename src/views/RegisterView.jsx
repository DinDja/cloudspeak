import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { isSectiEmail, describeAuthError } from '../lib/validators'
import { ALLOWED_AUTH_DOMAINS, AUTH_DOMAIN_LABEL } from '../lib/constants'
import { AuthErrorCode } from '../lib/firebaseAuth'

const AUTH_DOMAIN_ERROR = `Cadastre-se com um e-mail de um destes domínios: ${AUTH_DOMAIN_LABEL}.`

export default function RegisterView({ onBack, onGoLogin }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleEmailChange = (value) => {
    setEmail(value)
    if (value && !value.includes('@')) {
      setSuggestions(ALLOWED_AUTH_DOMAINS.map((domain) => `${value}@${domain}`))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion) => {
    setEmail(suggestion)
    setShowSuggestions(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Informe seu nome.')
      return
    }
    if (!isSectiEmail(email.trim())) {
      setError(AUTH_DOMAIN_ERROR)
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
        setError(AUTH_DOMAIN_ERROR)
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
      subtitle={`Acesso para e-mails autorizados: ${AUTH_DOMAIN_LABEL}.`}
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onGoLogin}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
            onChange={(event) => handleEmailChange(event.target.value)}
            onFocus={() => email && !email.includes('@') && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="seu e-mail autorizado"
            type="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            className="cs-input-base w-full py-4 pl-12 pr-4 text-base font-bold"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  onMouseDown={() => selectSuggestion(suggestion)}
                  className="cursor-pointer border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-b-0 hover:bg-blue-50"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
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
          <Motion.p
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </Motion.p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="cs-btn-base h-11 w-full gap-2 text-sm"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Criar minha conta <ArrowRight className="h-5 w-5" /></>}
        </button>

        <p className="text-center text-xs text-slate-500">
          Ao continuar você concorda com o uso dos dados conforme LGPD.
        </p>
      </form>
    </AuthLayout>
  )
}

function Field({ label, icon, children }) {
  const Icon = icon
  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 my-auto text-slate-400">
          <Icon className="h-4 w-4" />
        </div>
        {children}
      </div>
    </div>
  )
}
