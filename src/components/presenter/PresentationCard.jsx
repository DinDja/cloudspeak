import { Copy, Trash2, Play, Pencil, Plus, MoreHorizontal } from 'lucide-react'
import SlideThumbnail from './SlideThumbnail'

export default function PresentationCard({
  presentation,
  onEdit,
  onPresent,
  onNewSession,
  onDuplicate,
  onDelete,
  formatRelativeDate,
  busy,
}) {
  const { title, slides, updatedAt } = presentation
  const count = slides?.length || 0
  const edit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onEdit?.(presentation)
  }
  return (
    <article className="deck-row">
      <button type="button" onClick={edit} aria-label={`Editar ${title}`}>
        <SlideThumbnail slide={slides?.[0]} compact />
      </button>
      <div>
        <button type="button" className="deck-row__title" onClick={edit}>
          {title}
        </button>
        <p className="deck-row__meta">
          {count} {count === 1 ? 'slide' : 'slides'} · Editada {formatRelativeDate(updatedAt)}
        </p>
      </div>
      <div className="deck-row__actions">
        <button
          type="button"
          className="fala-button"
          disabled={busy}
          onClick={() => onPresent(presentation)}
        >
          <Play size={13} />
          {busy ? 'Abrindo…' : 'Apresentar'}
        </button>
        <button
          type="button"
          className="fala-button fala-button--secondary"
          disabled={busy}
          onClick={edit}
          aria-label={`Editar ${title}`}
          title="Editar apresentação"
        >
          <Pencil size={13} />
          Editar
        </button>
        <details className="dashboard-menu">
          <summary className="fala-icon-button" aria-label={`Mais ações para ${title}`} title="Mais ações">
            <MoreHorizontal size={17} />
          </summary>
          <div className="dashboard-menu__popover">
            <button type="button" disabled={busy} onClick={(event) => {
              event.currentTarget.closest('details').open = false
              onNewSession(presentation)
            }}>
              <Plus size={14} /> Nova seção
            </button>
            <button type="button" disabled={busy} onClick={(event) => {
              event.currentTarget.closest('details').open = false
              onDuplicate(presentation)
            }}>
              <Copy size={14} /> Duplicar
            </button>
            <button type="button" className="dashboard-menu__danger" disabled={busy} onClick={(event) => {
              event.currentTarget.closest('details').open = false
              onDelete(presentation)
            }}>
              <Trash2 size={14} /> Apagar
            </button>
          </div>
        </details>
      </div>
    </article>
  )
}
