import { Copy, Trash2, Play, Pencil } from 'lucide-react'
import SlideThumbnail from './SlideThumbnail'

export default function PresentationCard({
  presentation,
  onEdit,
  onPresent,
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
          className="fala-button fala-button--secondary"
          disabled={busy}
          onClick={edit}
          aria-label={`Editar ${title}`}
          title="Editar apresentação"
        >
          <Pencil size={13} />
          Editar
        </button>
        <button
          type="button"
          className="fala-button fala-button--secondary"
          disabled={busy}
          onClick={() => onPresent(presentation)}
        >
          <Play size={13} />
          {busy ? 'Abrindo…' : 'Apresentar'}
        </button>
        <button
          type="button"
          className="fala-icon-button"
          onClick={() => onDuplicate(presentation)}
          disabled={busy}
          aria-label={`Duplicar ${title}`}
          title="Duplicar"
        >
          <Copy size={15} />
        </button>
        <button
          type="button"
          className="fala-icon-button"
          onClick={() => onDelete(presentation)}
          disabled={busy}
          aria-label={`Apagar ${title}`}
          title="Apagar"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  )
}
