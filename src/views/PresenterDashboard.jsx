import { useState } from 'react'
import { Plus, Search, ArrowRight } from 'lucide-react'
import WorkspaceShell from '../components/ui/WorkspaceShell'
import Modal from '../components/ui/Modal'
import PresentationCard from '../components/presenter/PresentationCard'
import TemplateCover from '../components/presenter/TemplateCover'
import { useAuth } from '../hooks/useAuth'
import { useSavedPresentations } from '../hooks/useSavedPresentations'
import { TEMPLATES } from '../lib/templates'

function formatRelativeDate(timestamp) {
  const millis = typeof timestamp?.toMillis === 'function' ? timestamp.toMillis() : timestamp
  if (typeof millis !== 'number') return 'recentemente'
  return new Date(millis).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function PresenterDashboard(props) {
  const { displayName, email, uid, logout } = useAuth()
  const saved = useSavedPresentations(uid)
  return (
    <DashboardContent
      {...props}
      {...saved}
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
  name,
  email,
  onNew,
  onEdit,
  onPresent,
  onDuplicate,
  onDelete,
  onLogout,
}) {
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
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
    </WorkspaceShell>
  )
}
