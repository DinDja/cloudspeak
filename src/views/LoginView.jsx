import { useId, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { isSectiEmail, describeAuthError } from '../lib/validators'
import { ALLOWED_AUTH_DOMAINS, AUTH_DOMAIN_LABEL } from '../lib/constants'
import { AuthErrorCode } from '../lib/firebaseAuth'

const AUTH_DOMAIN_ERROR = `Use um e-mail de um destes domínios: ${AUTH_DOMAIN_LABEL}.`

export default function LoginView({ onBack, onGoRegister }) {
  const { login, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
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

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      if (err.code === AuthErrorCode.NOT_SECTI) {
        setError(AUTH_DOMAIN_ERROR)
      } else if (err.code === AuthErrorCode.NOT_VERIFIED) {
        setError('Confirme seu e-mail antes de continuar.')
      } else {
        setError(err.message || describeAuthError(err.code))
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isSectiEmail(email.trim())) {
      setError(AUTH_DOMAIN_ERROR)
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
        setError(AUTH_DOMAIN_ERROR)
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
      title="Acesso ao estúdio"
      subtitle="Entre com sua conta institucional para criar e apresentar."
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onGoRegister}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          Não tem conta? Criar conta
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="relative">
          <Field
            label="E-mail institucional"
            icon={Mail}
            type="email"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            onFocus={() => email && !email.includes('@') && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="seu e-mail autorizado"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
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
        </div>
        <Field
          label="Senha"
          icon={Lock}
          type={showPwd ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Sua senha"
          rightAction={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {showPwd ? 'Ocultar' : 'Mostrar'}
            </button>
          }
        />

        {error && (
          <Motion.p
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </Motion.p>
        )}

        <button type="submit" disabled={loading} className="cs-btn-base mt-2 h-11 w-full gap-2 text-sm">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              Entrar no estúdio <ArrowRight className="h-6 w-6" strokeWidth={3} />
            </>
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#f6f4ef] px-4 text-xs font-normal text-stone-500">Ou continue com</span>
          </div>
        </div>

        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleLogin}
          className="cs-btn-base h-11 w-full gap-2 border-slate-200 !bg-white !text-slate-700 hover:!bg-slate-50"
        >
          {googleLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          Acesso permitido para: {AUTH_DOMAIN_LABEL}.
        </p>
      </form>
    </AuthLayout>
  )
}

function Field({ label, icon, rightAction, id, ...rest }) {
  const FieldIcon = icon
  const generatedId = useId()
  const fieldId = id || rest.name || generatedId
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between text-sm font-medium text-slate-700">
        <label htmlFor={fieldId}>{label}</label>
        {rightAction}
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 my-auto flex items-center text-[#09090B]">
          <FieldIcon className="h-5 w-5" />
        </div>
        <input
          id={fieldId}
          {...rest}
          /* A classe cs-input-base já possui o visual principal via CSS. Aqui ajustamos o padding para o ícone */
          className="cs-input-base pl-14"
        />
      </div>
    </div>
  )
}
