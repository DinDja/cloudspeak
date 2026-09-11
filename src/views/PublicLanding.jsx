import { useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { isValidSessionCode } from '../lib/validators'
import Logo from '../components/ui/Logo'
import SectiMark from '../components/ui/SectiMark'
import ConversationArtwork from '../components/ui/ConversationArtwork'
import { EDUCATION_EVENT } from '../lib/eventData'

export default function PublicLanding({
  initialCode = '',
  initialAttendance = false,
  onJoin,
  onPresenterLogin,
  loading,
  error,
}) {
  const [entry, setEntry] = useState({ initialCode, code: initialCode })
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  // A QR link may arrive after the authentication gate resolves.
  const code = entry.initialCode === initialCode ? entry.code : initialCode
  const canJoin = isValidSessionCode(code.trim()) && (!initialAttendance || name.trim().length >= 3)
  const submit = (event) => {
    event.preventDefault()
    if (canJoin && !loading) onJoin(name, code.trim(), { attendance: initialAttendance, institution })
  }

  return (
    <div className="fala-app public-page">
      <header className="public-header">
        <Logo />
        <span className="public-header__description">
          Apresentações interativas
          <br />
          Secretaria Educação do Estado da Bahia
        </span>
        <button type="button" className="fala-link" onClick={onPresenterLogin}>
          Acesso do apresentador <ArrowUpRight size={18} />
        </button>
      </header>
      <main className="public-main">
        <section className="public-entry" aria-labelledby="join-title">
          <p className="fala-eyebrow">{initialAttendance ? 'LISTA DE PRESENÇA' : 'PARTICIPE DE UMA APRESENTAÇÃO'}</p>
          <h1 id="join-title" className="public-title">
            {initialAttendance ? 'Confirme sua' : 'Sua vez'}
            <br />
            {initialAttendance ? <span>presença.</span> : <>de <span>falar.</span></>}
          </h1>
          <p className="public-intro">
            {initialAttendance ? 'Registre seu nome para compor a lista de frequência.' : 'Sua opinião entra na conversa.'}
            <br />
            {initialAttendance ? 'Depois, participe das perguntas do seminário.' : 'Use o código que aparece na tela.'}
          </p>
          <form className="join-form" onSubmit={submit}>
            <label htmlFor="session-code">Código da apresentação</label>
            <input
              id="session-code"
              className="join-code"
              value={code}
              onChange={(event) =>
                setEntry({ initialCode, code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })
              }
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby={error ? 'join-error' : undefined}
              aria-invalid={Boolean(error)}
            />
            <label htmlFor="participant-name" className="join-name-label">
              Seu nome {!initialAttendance && <span>opcional</span>}
            </label>
            <input
              id="participant-name"
              className="join-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              autoComplete="given-name"
              placeholder={initialAttendance ? 'Nome completo' : 'Como você quer aparecer?'}
            />
            {initialAttendance && (
              <>
                <label htmlFor="participant-institution" className="join-name-label">
                  Órgão, escola ou instituição <span>opcional</span>
                </label>
                <input
                  id="participant-institution"
                  className="join-name"
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  maxLength={120}
                  autoComplete="organization"
                  list="event-institution-suggestions"
                  placeholder="Ex.: SEC, NTE ou escola"
                />
                <datalist id="event-institution-suggestions">
                  {EDUCATION_EVENT.schools.map((school) => <option key={school} value={school} />)}
                </datalist>
              </>
            )}
            <button type="submit" disabled={!canJoin || loading} className="fala-button join-submit">
              {loading ? 'Conectando…' : initialAttendance ? 'Registrar presença e entrar' : 'Entrar na apresentação'}
              <ArrowRight size={20} />
            </button>
            {error && (
              <p id="join-error" role="alert" className="fala-error">
                {error}
              </p>
            )}
          </form>
          <p className="join-note">
            {initialAttendance ? 'Seu registro será usado apenas na ata e na lista de frequência do evento.' : 'Para participar, você não precisa criar uma conta.'}
          </p>
        </section>
        <ConversationArtwork interactive />
      </main>
      <footer className="public-footer">
        <span>
         Educação 
          <br />
          <strong>com a participação de todo mundo.</strong>
        </span>
        <img src="/brasao-bahia.png" className="h-12" />
      </footer>
    </div>
  )
}
