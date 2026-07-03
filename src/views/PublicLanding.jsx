import { useState, useEffect } from 'react'
import { isValidSessionCode } from '../lib/validators'
import Logo from '../components/ui/Logo'
import { IconKey, IconLock, IconUser } from '../components/icons/Icons'

export default function PublicLanding({ initialCode = '', onJoin, onPresenterLogin, loading, error }) {
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const canJoin = isValidSessionCode(code.trim())

  useEffect(() => {
    if (initialCode) setCode(initialCode)
  }, [initialCode])

  const submit = (event) => {
    event.preventDefault()
    if (!canJoin || loading) return
    onJoin(name, code.trim())
  }

  return (
    <div
      className="cs-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F4F4F0] px-4 py-8"
      style={{ background: `url(/Group.svg) no-repeat left center / 50%, url(/brasao-bahia.png) no-repeat right 24px bottom 24px / 150px auto, #F4F4F0` }}
    >
      <div className="absolute left-6 top-6">
        <Logo size="sm" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#09090B]">
            Entrar na sessão
          </h1>
          <p className="mt-2 text-sm font-bold uppercase tracking-widest text-[#09090B]/70">
            Digite o código exibido na tela
          </p>
        </div>

        <form 
          onSubmit={submit} 
          className="cs-card space-y-6 p-6"
        >
          <div>
            <label className="mb-2 ml-1 block text-xs font-black uppercase tracking-widest text-[#09090B]">
              Código da sala
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 my-auto flex items-center text-[#09090B]">
                <IconKey className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="EX: 4F9K2A"
                inputMode="text"
                autoCapitalize="characters"
                className="cs-input-base w-full pl-14 text-center text-2xl tracking-[0.3em]"
                maxLength={6}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-black uppercase tracking-widest text-[#09090B]">
              Seu nome (opcional)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 my-auto flex items-center text-[#09090B]">
                <IconUser className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="COMO DEVEMOS TE CHAMAR?"
                maxLength={40}
                className="cs-input-base w-full pl-14 uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !canJoin}
            className="cs-btn-base h-14 w-full gap-2 text-base !bg-[#E2FF32] !text-[#09090B] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[5px_5px_0px_0px_#09090B]"
          >
            {loading ? (
              <>
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path d="M21 12a9 9 0 01-9 9" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
                </svg>
                ENTRANDO…
              </>
            ) : (
              'ENTRAR NA SESSÃO'
            )}
          </button>

          {error && (
            <p className="border-[3px] border-[#09090B] bg-[#FF0055] px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_0px_#09090B]">
              {error}
            </p>
          )}
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onPresenterLogin}
            className="inline-flex items-center gap-2 border-[3px] border-transparent px-4 py-2 text-sm font-black uppercase tracking-widest text-[#09090B] transition-none hover:border-[#09090B] hover:bg-[#E2FF32] hover:shadow-[4px_4px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <IconLock className="h-5 w-5" strokeWidth={2.5} />
            Sou apresentador
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="inline-block bg-[#09090B] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#F4F4F0]">
            Sistema interno SECTI · Uso restrito
          </p>
        </div>
      </div>
    </div>
  )
}