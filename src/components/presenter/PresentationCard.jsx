import { Copy, Trash2, Play, Pencil, Plus, MoreHorizontal } from 'lucide-react'
import { AVANCA_EVENT_KEY } from '../../lib/eventData'
import DashboardSlideCarousel from './DashboardSlideCarousel'

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
  const eventKey = presentation.eventKey || (
    slides?.some((slide) => slide?.style?.theme === 'avanca')
      ? AVANCA_EVENT_KEY
      : null
  )
  const edit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onEdit?.(presentation)
  }
  return (
    <article className="deck-row">
      <DashboardSlideCarousel
        slides={slides || []}
        total={count}
        presentationTitle={title}
        eventKey={eventKey}
        onEdit={edit}
      />
      <div className="deck-row__info">
        <div className="deck-row__heading">
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
      </div>
    </article>
  )
}
