import { useMemo, useState } from 'react'
import { LayoutTemplate, LogOut, Plus, Search, Presentation } from 'lucide-react'
import Logo from '../components/ui/Logo'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import PresentationCard from '../components/presenter/PresentationCard'
import { useAuth } from '../hooks/useAuth'
import { useSavedPresentations } from '../hooks/useSavedPresentations'

export default function PresenterDashboard({ onNew, onEdit, onPresent, onDuplicate, onDelete, onLogout }) {
  const { displayName, email, uid } = useAuth()
  const { presentations, loading, error } = useSavedPresentations(uid)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const greeting = displayName || (email ? email.split('@')[0] : 'apresentador')

  const filtered = useMemo(() => {
    if (!query.trim()) return presentations
    const q = query.trim().toLowerCase()
    return presentations.filter((p) => (p.title ?? '').toLowerCase().includes(q))
  }, [presentations, query])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      console.error('delete presentation failed', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-canvas font-sans text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">{greeting}</p>
              <p className="text-xs font-medium text-slate-500">{email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge tone="brand" dot>Estúdio do apresentador</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Suas apresentações
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Crie, edite e lance apresentações interativas em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-brand-gradient px-6 py-3.5 text-base font-black text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" /> Nova apresentação
          </button>
        </div>

        {presentations.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título..."
              className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600"
            />
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-4xl bg-white ring-1 ring-slate-200" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Presentation} title="Não foi possível carregar" description={error} />
        ) : filtered.length === 0 ? (
          presentations.length === 0 ? (
            <EmptyState
              icon={LayoutTemplate}
              title="Nenhuma apresentação ainda"
              description="Crie sua primeira apresentação interativa e lance para o público ao vivo."
              action={
                <button
                  type="button"
                  onClick={onNew}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-5 py-3 text-sm font-black text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float"
                >
                  <Plus className="h-4 w-4" /> Criar apresentação
                </button>
              }
            />
          ) : (
            <EmptyState icon={Search} title="Nada encontrado" description={`Nenhuma apresentação com "${query}".`} />
          )
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((presentation) => (
              <PresentationCard
                key={presentation.id}
                presentation={presentation}
                onEdit={onEdit}
                onPresent={onPresent}
                onDuplicate={onDuplicate}
                onDelete={(p) => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </main>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="max-w-md">
        <h3 className="text-lg font-black text-slate-900">Confirmar exclusão</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Tem certeza que deseja apagar <strong>{deleteTarget?.title}</strong>? Esta ação não pode ser desfeita.
          Sessões já lançadas não serão afetadas.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-rose-700 disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Apagar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
