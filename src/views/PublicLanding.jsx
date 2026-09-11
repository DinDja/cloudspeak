import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, ChevronDown, Search, X } from 'lucide-react'
import { isValidSessionCode } from '../lib/validators'
import Logo from '../components/ui/Logo'
import ConversationArtwork from '../components/ui/ConversationArtwork'
import { ATTENDANCE_INSTITUTIONS, OTHER_ATTENDANCE_INSTITUTION } from '../lib/eventData'

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
  const [otherInstitution, setOtherInstitution] = useState('')
  const [institutionSearch, setInstitutionSearch] = useState('')
  const [institutionOpen, setInstitutionOpen] = useState(false)
  // A QR link may arrive after the authentication gate resolves.
  const code = entry.initialCode === initialCode ? entry.code : initialCode
  const filteredInstitutions = useMemo(() => {
    const query = institutionSearch.trim().toLocaleLowerCase('pt-BR')
    if (!query) return ATTENDANCE_INSTITUTIONS
    return ATTENDANCE_INSTITUTIONS.filter((item) => item.toLocaleLowerCase('pt-BR').includes(query))
  }, [institutionSearch])
  const isOtherInstitution = institution === OTHER_ATTENDANCE_INSTITUTION
  const selectedInstitution = isOtherInstitution ? otherInstitution.trim() : institution.trim()
  const canJoin =
    isValidSessionCode(code.trim()) &&
    (!initialAttendance || (name.trim().length >= 3 && selectedInstitution.length > 0))
  const submit = (event) => {
    event.preventDefault()
    if (canJoin && !loading) {
      onJoin(name, code.trim(), {
        attendance: initialAttendance,
        institution,
        institutionOther: isOtherInstitution ? otherInstitution : '',
      })
    }
  }
  const chooseInstitution = (item) => {
    setInstitution(item)
    if (item !== OTHER_ATTENDANCE_INSTITUTION) setOtherInstitution('')
    setInstitutionSearch('')
    setInstitutionOpen(false)
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
              Seu nome {initialAttendance ? <span>obrigatório</span> : <span>opcional</span>}
            </label>
            <input
              id="participant-name"
              className="join-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              autoComplete="given-name"
              placeholder={initialAttendance ? 'Nome completo' : 'Como você quer aparecer?'}
              required={initialAttendance}
            />
            {initialAttendance && (
              <>
                <label htmlFor="participant-institution" className="join-name-label">
                  Órgão, escola ou instituição <span>obrigatório</span>
                </label>
                <div className="institution-picker">
                  <button
                    id="participant-institution"
                    type="button"
                    className={`institution-trigger${institution ? ' institution-trigger--selected' : ''}`}
                    onClick={() => setInstitutionOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={institutionOpen}
                    aria-required="true"
                  >
                    <span>{institution || 'Pesquisar e selecionar na lista'}</span>
                    <ChevronDown size={16} className={institutionOpen ? 'rotate-180' : ''} />
                  </button>
                  {institutionOpen && (
                    <div className="institution-popover">
                      <div className="institution-search-wrap">
                        <Search size={15} />
                        <input
                          autoFocus
                          className="institution-search"
                          value={institutionSearch}
                          onChange={(event) => setInstitutionSearch(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') setInstitutionOpen(false)
                            if (event.key === 'Enter' && filteredInstitutions.length === 1) {
                              event.preventDefault()
                              chooseInstitution(filteredInstitutions[0])
                            }
                          }}
                          placeholder="Pesquisar escola ou órgão..."
                          aria-label="Pesquisar instituição"
                          aria-controls="institution-options"
                          aria-autocomplete="list"
                        />
                        {institutionSearch && (
                          <button
                            type="button"
                            className="institution-search-clear"
                            onClick={() => setInstitutionSearch('')}
                            aria-label="Limpar pesquisa"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div id="institution-options" className="institution-options" role="listbox" aria-label="Instituições disponíveis">
                        {filteredInstitutions.length ? (
                          filteredInstitutions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              role="option"
                              aria-selected={institution === item}
                              className={`institution-option${institution === item ? ' institution-option--selected' : ''}`}
                              onClick={() => chooseInstitution(item)}
                            >
                              {item}
                            </button>
                          ))
                        ) : (
                          <p className="institution-empty">Nenhuma instituição encontrada.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {isOtherInstitution && (
                  <>
                    <label htmlFor="participant-institution-other" className="join-name-label">
                      Especifique o outro órgão, escola ou instituição <span>obrigatório</span>
                    </label>
                    <input
                      id="participant-institution-other"
                      className="join-name institution-other-input"
                      value={otherInstitution}
                      onChange={(event) => setOtherInstitution(event.target.value)}
                      maxLength={120}
                      placeholder="Digite o nome do órgão, escola ou instituição"
                      autoComplete="organization"
                      required
                    />
                  </>
                )}
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
            {initialAttendance
              ? 'Nome e instituição são obrigatórios. O registro será usado na ata e na lista de frequência do evento.'
              : 'Para participar, você não precisa criar uma conta.'}
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
