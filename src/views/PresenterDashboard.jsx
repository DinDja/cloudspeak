import { useState } from 'react'
import { Plus, Search, ArrowRight, Radio, Trash2, Pencil } from 'lucide-react'
import WorkspaceShell from '../components/ui/WorkspaceShell'
import Modal from '../components/ui/Modal'
import PresentationCard from '../components/presenter/PresentationCard'
import TemplateCover from '../components/presenter/TemplateCover'
import { useAuth } from '../hooks/useAuth'
import { useSavedPresentations } from '../hooks/useSavedPresentations'
import { useSavedSessions } from '../hooks/useSavedSessions'
import { TEMPLATES } from '../lib/templates'

function formatRelativeDate(timestamp) {
  const millis = typeof timestamp?.toMillis === 'function' ? timestamp.toMillis() : timestamp
  if (typeof millis !== 'number') return 'recentemente'
  return new Date(millis).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function PresenterDashboard(props) {
  const { displayName, email, uid, logout } = useAuth()
  const saved = useSavedPresentations(uid)
  const savedSessions = useSavedSessions(uid)
  return (
    <DashboardContent
      {...props}
      {...saved}
      sessions={savedSessions.sessions}
      sessionsLoading={savedSessions.loading}
      sessionsError={savedSessions.error}
      name={displayName || email?.split('@')[0]}
      email={email}
      onLogout={async () => {
        await logout()
        props.onLogout()
      }}
    />
  )
}

function SessionList({
  sessions,
  selectedSessionCodes,
  onToggle,
  onResume,
  onViewResponses,
  onEndProjection,
  onRename,
  onDelete,
  busyCode,
}) {
  return (
    <div className="ml-4 border-l-2 border-slate-200 pl-4 sm:ml-10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Seções desta apresentação
        </p>
        <span className="text-xs text-slate-400">{sessions.length}</span>
      </div>
      <div className="space-y-2">
        {sessions.map((session) => (
          <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <input
                type="checkbox"
                checked={selectedSessionCodes.includes(session.code)}
                onChange={() => onToggle(session.code)}
                aria-label={`Selecionar seção ${session.code}`}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <Radio size={15} className={session.status === 'live' ? 'text-emerald-600' : 'text-slate-400'} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {session.sessionLabel || `Seção ${session.code}`}
                </p>
                <p className="text-xs text-slate-500">
                  Código <span className="tracking-[0.18em]">{session.code}</span> · {session.status === 'live' ? 'Ao vivo' : 'Encerrada'} · {formatRelativeDate(session.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="fala-button fala-button--secondary"
                disabled={busyCode === session.code}
                onClick={() => onResume(session)}
              >
                {session.status === 'live' ? 'Retomar seção' : 'Tornar ao vivo'} <ArrowRight size={15} />
              </button>
              {session.status === 'ended' && (
                <button
                  type="button"
                  className="fala-button fala-button--secondary"
                  onClick={() => onViewResponses(session)}
                >
                  Ver respostas
                </button>
              )}
              <button
                type="button"
                className="fala-button fala-button--secondary"
                disabled={session.status === 'ended' || busyCode === session.code}
                onClick={() => onEndProjection(session)}
              >
                {session.status === 'live' ? 'Encerrar projeção' : 'Projeção encerrada'}
              </button>
              <button type="button" className="fala-button fala-button--secondary" onClick={() => onRename(session)}>
                <Pencil size={14} /> {session.sessionLabel ? 'Editar nome' : 'Dar nome'}
              </button>
              <button
                type="button"
                className="fala-button fala-button--danger"
                aria-label={`Apagar seção ${session.code}`}
                onClick={() => onDelete(session)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardContent({
  presentations,
  loading,
  error,
  sessions,
  sessionsLoading,
  sessionsError,
  name,
  email,
  onNew,
  onEdit,
  onPresent,
  onDuplicate,
  onDelete,
  onResumeSession,
  onSetSessionStatus,
  onRenameSession,
  onDeleteSession,
  onLogout,
}) {
  const [query, setQuery] = useState('')
  const [sessionPickerTarget, setSessionPickerTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteSessionTargets, setDeleteSessionTargets] = useState([])
  const [sessionNameTarget, setSessionNameTarget] = useState(null)
  const [sessionNameDraft, setSessionNameDraft] = useState('')
  const [selectedSessionCodes, setSelectedSessionCodes] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [deletingSession, setDeletingSession] = useState(false)
  const [savingSessionName, setSavingSessionName] = useState(false)
  const [sessionActionCode, setSessionActionCode] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const allSessionsSelected = sessions.length > 0 && sessions.every((session) => selectedSessionCodes.includes(session.code))
  const orphanSessions = sessions.filter((session) => !presentations.some((presentation) => presentation.id === session.presentationId))
  const filtered = presentations.filter((item) =>
    (item.title || '').toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')),
  )
  const starters = ['educacao-integral-integrada-bahia', 'kickoff', 'workshop'].map((id) => TEMPLATES.find((item) => item.id === id))

  const runAction = async (action, presentation) => {
    setBusyId(presentation.id)
    setActionError('')
    try {
      await action(presentation)
    } catch (err) {
      setActionError(err.message || 'Não foi possível concluir. Tente novamente.')
    } finally {
      setBusyId(null)
    }
  }
  const confirmDelete = async () => {
    setDeleting(true)
    setActionError('')
    try {
      await onDelete(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err.message || 'Não foi possível apagar a apresentação.')
    } finally {
      setDeleting(false)
    }
  }
  const confirmDeleteSession = async () => {
    setDeletingSession(true)
    setActionError('')
    try {
      await Promise.all(deleteSessionTargets.map((session) => onDeleteSession(session)))
      setSelectedSessionCodes([])
      setDeleteSessionTargets([])
    } catch (err) {
      setActionError(err.message || 'Não foi possível apagar a seção. Tente novamente.')
    } finally {
      setDeletingSession(false)
    }
  }
  const openSessionNameEditor = (session) => {
    setActionError('')
    setSessionNameTarget(session)
    setSessionNameDraft(session.sessionLabel ?? '')
  }
  const saveSessionName = async (event) => {
    event.preventDefault()
    if (!sessionNameTarget) return
    setSavingSessionName(true)
    setActionError('')
    try {
      await onRenameSession(sessionNameTarget.code, sessionNameDraft)
      setSessionNameTarget(null)
      setSessionNameDraft('')
    } catch (err) {
      setActionError(err.message || 'Não foi possível salvar o nome da seção.')
    } finally {
      setSavingSessionName(false)
    }
  }
  const resumeSession = async (session) => {
    setActionError('')
    setSessionActionCode(session.code)
    try {
      if (session.status === 'ended') await onSetSessionStatus(session.code, 'live')
      onResumeSession(session.code)
    } catch (err) {
      setActionError(err.message || 'Não foi possível retomar a projeção.')
    } finally {
      setSessionActionCode('')
    }
  }
  const endSessionProjection = async (session) => {
    setActionError('')
    setSessionActionCode(session.code)
    try {
      await onSetSessionStatus(session.code, 'ended')
    } catch (err) {
      setActionError(err.message || 'Não foi possível encerrar a projeção.')
    } finally {
      setSessionActionCode('')
    }
  }
  const createNewSession = (presentation) => runAction(onPresent, presentation)
  const requestPresentation = (presentation) => {
    const presentationSessions = sessions.filter((session) => session.presentationId === presentation.id)
    if (presentationSessions.length) {
      setSessionPickerTarget({ presentation, sessions: presentationSessions })
      return
    }
    createNewSession(presentation)
  }

  return (
    <WorkspaceShell
      name={name}
      email={email}
      active="presentations"
      onPresentations={() => setQuery('')}
      onTemplates={() => onNew('blank')}
      onLogout={onLogout}
    >
      <div className="workspace-title-row">
        <div>
          <p className="fala-eyebrow">SEU ESPAÇO DE TRABALHO</p>
          <h1 className="workspace-title">Apresentações</h1>
          <p className="workspace-subtitle">Prepare as perguntas. O encontro continua com o público.</p>
        </div>
        <button type="button" className="fala-button" onClick={() => onNew('blank')}>
          <Plus size={17} />
          Nova apresentação
        </button>
      </div>
      <div className="library-tools">
        <h2>
          Sua biblioteca <span className="text-xs text-stone-500">/ {presentations.length} apresentações · {sessions.length} seções</span>
        </h2>
        <label className="library-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pelo título"
            aria-label="Buscar apresentações"
          />
        </label>
      </div>
      {sessionsError && (
        <p className="fala-error mb-4" role="alert">{sessionsError}</p>
      )}
      {sessionsLoading && (
        <p className="mb-4 text-sm text-stone-500" role="status">Carregando seções salvas…</p>
      )}
      {sessions.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={allSessionsSelected}
              onChange={() => setSelectedSessionCodes(allSessionsSelected ? [] : sessions.map((session) => session.code))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Selecionar todas as seções
          </label>
          {selectedSessionCodes.length > 0 && (
            <button
              type="button"
              className="fala-button fala-button--danger"
              onClick={() => setDeleteSessionTargets(sessions.filter((session) => selectedSessionCodes.includes(session.code)))}
            >
              <Trash2 size={15} />
              Apagar selecionadas ({selectedSessionCodes.length})
            </button>
          )}
        </div>
      )}
      {actionError && !deleteTarget && (
        <p role="alert" className="fala-error">
          {actionError}
        </p>
      )}
      {loading ? (
        <p className="workspace-empty" role="status">
          Carregando apresentações…
        </p>
      ) : error ? (
        <p className="fala-error" role="alert">
          {error}
        </p>
      ) : filtered.length ? (
        <div className="library-list">
          {filtered.map((presentation) => {
            const presentationSessions = sessions.filter((session) => session.presentationId === presentation.id)
            return (
              <div key={presentation.id} className="space-y-3">
                <PresentationCard
                  presentation={presentation}
                  onEdit={onEdit}
                  onPresent={requestPresentation}
                  onNewSession={createNewSession}
                  onDuplicate={(item) => runAction(onDuplicate, item)}
                  onDelete={(item) => {
                    setActionError('')
                    setDeleteTarget(item)
                  }}
                  formatRelativeDate={formatRelativeDate}
                  busy={busyId === presentation.id}
                />
                {presentationSessions.length > 0 && (
                  <SessionList
                    sessions={presentationSessions}
                    selectedSessionCodes={selectedSessionCodes}
                    onToggle={(code) => setSelectedSessionCodes((current) => current.includes(code)
                      ? current.filter((item) => item !== code)
                      : [...current, code])}
                    onResume={resumeSession}
                    onViewResponses={(session) => onResumeSession(session.code)}
                    onEndProjection={endSessionProjection}
                    onRename={openSessionNameEditor}
                    onDelete={(session) => {
                      setActionError('')
                      setDeleteSessionTargets([session])
                    }}
                    busyCode={sessionActionCode}
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="workspace-empty">
          <h3>{query ? 'Nenhum título corresponde à busca.' : 'Você ainda não tem apresentações.'}</h3>
          <p>
            {query
              ? 'Tente outro nome ou limpe o campo de busca.'
              : 'Comece com uma apresentação em branco ou use um dos modelos abaixo. Tudo pode ser editado.'}
          </p>
          <button type="button" className="fala-link" onClick={() => (query ? setQuery('') : onNew('blank'))}>
            {query ? 'Limpar busca' : 'Criar minha primeira apresentação'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      {orphanSessions.length > 0 && (
        <section className="mt-10" aria-labelledby="orphan-sessions-title">
          <div className="section-heading">
            <h2 id="orphan-sessions-title">Seções sem apresentação vinculada</h2>
            <span className="text-sm text-stone-500">{orphanSessions.length}</span>
          </div>
          <SessionList
            sessions={orphanSessions}
            selectedSessionCodes={selectedSessionCodes}
            onToggle={(code) => setSelectedSessionCodes((current) => current.includes(code)
              ? current.filter((item) => item !== code)
              : [...current, code])}
            onResume={resumeSession}
            onViewResponses={(session) => onResumeSession(session.code)}
            onEndProjection={endSessionProjection}
            onRename={openSessionNameEditor}
            onDelete={(session) => {
              setActionError('')
              setDeleteSessionTargets([session])
            }}
            busyCode={sessionActionCode}
          />
        </section>
      )}
      <section className="inspiration" aria-labelledby="inspiration-title">
        <div className="section-heading">
          <h2 id="inspiration-title">Um ponto de partida</h2>
          <button type="button" className="fala-link" onClick={() => onNew('blank')}>
            Todos os modelos <ArrowRight size={16} />
          </button>
        </div>
        <div className="template-grid">
          {starters.map((template, index) => (
            <TemplateCover
              key={template.id}
              template={template}
              index={index}
              onClick={() => onNew(template.id)}
            />
          ))}
        </div>
      </section>
      <Modal
        open={Boolean(sessionPickerTarget)}
        onClose={() => setSessionPickerTarget(null)}
        maxWidth="max-w-lg"
      >
        <p className="fala-eyebrow">SEÇÕES DISPONÍVEIS</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Como deseja apresentar?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Escolha uma seção ao vivo para retomar ou crie uma nova seção para esta apresentação.
        </p>
        <div className="mt-5 space-y-2">
          {sessionPickerTarget?.sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {session.sessionLabel || `Seção ${session.code}`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Código <span className="tracking-[0.18em]">{session.code}</span> · {session.status === 'live' ? 'Ao vivo' : 'Encerrada'} · {formatRelativeDate(session.createdAt)}
                </p>
              </div>
              {session.status === 'live' ? (
                <button type="button" className="fala-button fala-button--secondary shrink-0" onClick={() => {
                  setSessionPickerTarget(null)
                  onResumeSession(session.code)
                }}>
                  Retomar seção <ArrowRight size={15} />
                </button>
              ) : (
                <span className="shrink-0 text-xs font-medium text-slate-400">Indisponível</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="fala-button fala-button--secondary" onClick={() => setSessionPickerTarget(null)}>
            Cancelar
          </button>
          <button type="button" className="fala-button" onClick={() => {
            const presentation = sessionPickerTarget?.presentation
            setSessionPickerTarget(null)
            if (presentation) createNewSession(presentation)
          }}>
            <Plus size={15} />
            Nova seção
          </button>
        </div>
      </Modal>
      <Modal
        open={Boolean(sessionNameTarget)}
        onClose={() => {
          if (!savingSessionName) {
            setSessionNameTarget(null)
            setSessionNameDraft('')
          }
        }}
      >
        <form onSubmit={saveSessionName}>
          <h2 className="text-xl font-semibold">
            {sessionNameTarget?.sessionLabel ? 'Editar nome da seção' : 'Dar nome à seção'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Use um nome para identificar esta seção na lista, por exemplo, turma ou turno.
          </p>
          <label className="editor-field mt-5">
            <span>Nome da seção</span>
            <input
              className="fala-input"
              value={sessionNameDraft}
              onChange={(event) => setSessionNameDraft(event.target.value)}
              maxLength={80}
              autoFocus
              placeholder="Ex.: Turma da manhã"
            />
          </label>
          {actionError && <p className="fala-error mt-3" role="alert">{actionError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="fala-button fala-button--secondary"
              disabled={savingSessionName}
              onClick={() => {
                setSessionNameTarget(null)
                setSessionNameDraft('')
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="fala-button" disabled={savingSessionName}>
              {savingSessionName ? 'Salvando…' : 'Salvar nome'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
      >
        <h2 className="text-xl font-semibold">Apagar apresentação?</h2>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          “{deleteTarget?.title}” será removida. Sessões que já foram abertas continuam disponíveis.
        </p>
        {actionError && (
          <p className="fala-error" role="alert">
            {actionError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="fala-button fala-button--secondary"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="fala-button fala-button--danger"
            disabled={deleting}
            onClick={confirmDelete}
          >
            {deleting ? 'Apagando…' : 'Apagar'}
          </button>
        </div>
      </Modal>
      <Modal
        open={deleteSessionTargets.length > 0}
        onClose={() => {
          if (!deletingSession) setDeleteSessionTargets([])
        }}
      >
        <h2 className="text-xl font-semibold">
          Apagar {deleteSessionTargets.length === 1 ? 'seção' : 'seções'}?
        </h2>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          {deleteSessionTargets.length === 1
            ? `A seção “${deleteSessionTargets[0]?.sessionLabel || deleteSessionTargets[0]?.title}” e o código ${deleteSessionTargets[0]?.code} serão removidos.`
            : `${deleteSessionTargets.length} seções serão removidas.`}{' '}
          As respostas e os registros associados também serão apagados. Essa ação não pode ser desfeita.
        </p>
        {actionError && (
          <p className="fala-error" role="alert">
            {actionError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="fala-button fala-button--secondary"
            disabled={deletingSession}
            onClick={() => setDeleteSessionTargets([])}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="fala-button fala-button--danger"
            disabled={deletingSession}
            onClick={confirmDeleteSession}
          >
            {deletingSession ? 'Apagando…' : 'Apagar selecionadas'}
          </button>
        </div>
      </Modal>
    </WorkspaceShell>
  )
}
