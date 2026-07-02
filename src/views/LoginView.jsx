import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { isSectiEmail, describeAuthError } from '../lib/validators'
import { AuthErrorCode } from '../lib/firebaseAuth'

export default function LoginView({ onBack, onGoRegister }) {
  const { login, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      if (err.code === AuthErrorCode.NOT_SECTI) {
        setError('Use um e-mail @secti.ba.gov.br.')
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
      title="BEM-VINDO DE VOLTA"
      subtitle="ACESSE O ESTÚDIO E CONTINUE SUAS APRESENTAÇÕES AO VIVO."
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onGoRegister}
          className="inline-flex items-center gap-1.5 border-[3px] border-transparent px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#09090B] transition-none hover:border-[#09090B] hover:bg-[#E2FF32] hover:shadow-[4px_4px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Sparkles className="h-4 w-4" /> Não tem conta? Criar
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        <Field
          label="E-mail institucional"
          icon={Mail}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@secti.ba.gov.br"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <Field
          label="Senha"
          icon={Lock}
          type={showPwd ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="SUA SENHA"
          rightAction={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="border-[2px] border-[#09090B] bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#09090B] shadow-[2px_2px_0px_0px_#09090B] transition-none hover:bg-[#E2FF32] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {showPwd ? 'Ocultar' : 'Mostrar'}
            </button>
          }
        />

        {error && (
          <motion.p
            className="border-[3px] border-[#09090B] bg-[#FF0055] px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_0px_#09090B]"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="cs-btn-base mt-2 h-14 w-full gap-2 text-base !bg-[#E2FF32] !text-[#09090B]"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              ENTRAR NO ESTÚDIO <ArrowRight className="h-6 w-6" strokeWidth={3} />
            </>
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-[#09090B]/20"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs font-black uppercase tracking-widest text-[#09090B]/60">
              Ou continue com
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleLogin}
          className="cs-btn-base h-14 w-full gap-2 !bg-white !text-[#09090B] hover:!bg-gray-50"
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
              GOOGLE
            </>
          )}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#09090B]/60">
          Apenas servidores com e-mail @secti.ba.gov.br podem acessar.
        </p>
      </form>
    </AuthLayout>
  )
}

function Field({ label, icon: Icon, rightAction, id, ...rest }) {
  const fieldId = id || rest.name || `f-${Math.random().toString(36).slice(2, 8)}`
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-2 ml-1 flex items-end justify-between text-xs font-black uppercase tracking-widest text-[#09090B]"
      >
        {label}
        {rightAction}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 my-auto flex items-center text-[#09090B]">
          <Icon className="h-6 w-6" strokeWidth={2.5} />
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