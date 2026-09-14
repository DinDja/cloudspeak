import { useState } from 'react'
import { Plus, Search, ArrowRight, Radio, Trash2 } from 'lucide-react'
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
  onDeleteSession,
  onLogout,
}) {
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteSessionTarget, setDeleteSessionTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deletingSession, setDeletingSession] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
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
      await onDeleteSession(deleteSessionTarget)
      setDeleteSessionTarget(null)
    } catch (err) {
      setActionError(err.message || 'Não foi possível apagar a seção. Tente novamente.')
    } finally {
      setDeletingSession(false)
    }
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
      <section className="mb-10" aria-labelledby="sessions-title">
        <div className="library-tools">
          <h2 id="sessions-title">
            Suas seções <span className="text-xs text-stone-500">/ {sessions.length}</span>
          </h2>
          <p className="text-sm text-stone-500">Continue uma seção existente sem gerar outro código.</p>
        </div>
        {sessionsLoading ? (
          <p className="workspace-empty" role="status">Carregando seções…</p>
        ) : sessionsError ? (
          <p className="fala-error" role="alert">{sessionsError}</p>
        ) : sessions.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Radio size={16} className={session.status === 'live' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {session.status === 'live' ? 'Ao vivo' : 'Encerrada'}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-semibold text-slate-900">{session.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Código <span className="font-bold tracking-[0.18em] text-slate-800">{session.code}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {session.slides?.length ?? 0} seções
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">{formatRelativeDate(session.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {session.status === 'live' && (
                      <button type="button" className="fala-button fala-button--secondary" onClick={() => onResumeSession(session.code)}>
                        Retomar seção <ArrowRight size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="fala-button fala-button--danger"
                      aria-label={`Apagar seção ${session.title}`}
                      onClick={() => {
                        setActionError('')
                        setDeleteSessionTarget(session)
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="workspace-empty">As seções criadas aparecerão aqui.</p>
        )}
      </section>
      <div className="library-tools">
        <h2>
          Sua biblioteca <span className="text-xs text-stone-500">/ {presentations.length}</span>
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
          {filtered.map((presentation) => (
            <PresentationCard
              key={presentation.id}
              presentation={presentation}
              onEdit={onEdit}
              onPresent={(item) => runAction(onPresent, item)}
              onDuplicate={(item) => runAction(onDuplicate, item)}
              onDelete={(item) => {
                setActionError('')
                setDeleteTarget(item)
              }}
              formatRelativeDate={formatRelativeDate}
              busy={busyId === presentation.id}
            />
          ))}
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
        open={Boolean(deleteSessionTarget)}
        onClose={() => {
          if (!deletingSession) setDeleteSessionTarget(null)
        }}
      >
        <h2 className="text-xl font-semibold">Apagar seção?</h2>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          A seção “{deleteSessionTarget?.title}” e o código {deleteSessionTarget?.code} serão removidos, junto com as respostas e os registros associados. Essa ação não pode ser desfeita.
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
            onClick={() => setDeleteSessionTarget(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="fala-button fala-button--danger"
            disabled={deletingSession}
            onClick={confirmDeleteSession}
          >
            {deletingSession ? 'Apagando…' : 'Apagar seção'}
          </button>
        </div>
      </Modal>
    </WorkspaceShell>
  )
}
