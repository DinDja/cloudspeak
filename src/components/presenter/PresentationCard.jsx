import { CalendarClock, Layers, MoreVertical, Pencil, Play, Copy, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Badge from '../ui/Badge'

function formatRelativeDate(timestamp) {
  if (!timestamp) return '—'
  const millis = typeof timestamp.toMillis === 'function' ? timestamp.toMillis() : timestamp
  if (typeof millis !== 'number') return '—'
  const diff = Date.now() - millis
  const day = 86400000
  if (diff < day) return 'hoje'
  if (diff < 2 * day) return 'ontem'
  if (diff < 7 * day) return `${Math.floor(diff / day)} dias atrás`
  return new Date(millis).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function PresentationCard({ presentation, onEdit, onPresent, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const slideCount = presentation.slides?.length ?? 0

  return (
    <div className="group relative flex flex-col rounded-4xl bg-white p-6 ring-1 ring-slate-200/70 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float hover:ring-brand-200">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-soft">
          <Layers className="h-5 w-5" />
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            onBlur={() => window.setTimeout(() => setMenuOpen(false), 150)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Mais ações"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl bg-white p-1.5 shadow-float ring-1 ring-slate-200 cs-scale-in">
              <button
                type="button"
                onMouseDown={() => onDuplicate(presentation)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Copy className="h-4 w-4 text-slate-400" /> Duplicar
              </button>
              <button
                type="button"
                onMouseDown={() => onDelete(presentation)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="line-clamp-2 text-lg font-black tracking-tight text-slate-900">
        {presentation.title || 'Sem título'}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="brand"><Layers className="h-3.5 w-3.5" /> {slideCount} {slideCount === 1 ? 'slide' : 'slides'}</Badge>
        <Badge tone="slate"><CalendarClock className="h-3.5 w-3.5" /> {formatRelativeDate(presentation.updatedAt)}</Badge>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onPresent(presentation)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float"
        >
          <Play className="h-4 w-4 fill-current" /> Apresentar
        </button>
        <button
          type="button"
          onClick={() => onEdit(presentation)}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
        >
          <Pencil className="h-4 w-4" /> Editar
        </button>
      </div>
    </div>
  )
}
