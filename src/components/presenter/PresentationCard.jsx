import { FilePenLine, Presentation, Copy, Trash2 } from 'lucide-react'

export default function PresentationCard({ presentation, onEdit, onPresent, onDuplicate, onDelete, formatRelativeDate }) {
  const { title, slides, updatedAt } = presentation
  const slidesCount = slides?.length || 0
  const lastUpdated = formatRelativeDate(updatedAt)

  return (
    <div className="flex h-full flex-col border-[3px] border-[#09090B] bg-white p-5 shadow-[6px_6px_0px_0px_#09090B]">
      <div className="flex-grow">
        <h3 className="text-lg font-black uppercase tracking-tight text-[#09090B]">{title}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-600">
          <span>{slidesCount} slides</span>
          <span className="text-slate-300">•</span>
          <span>Atualizado em {lastUpdated}</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button 
          onClick={() => onEdit(presentation)}
          className="cs-btn-base h-11 gap-2 bg-[#FCFBF9] px-4 text-sm font-bold text-[#09090B]"
        >
          <FilePenLine className="h-4 w-4" />
          Editar
        </button>
        <button 
          onClick={() => onPresent(presentation)}
          className="cs-btn-base h-11 gap-2 bg-[#09090B] px-4 text-sm font-black text-white"
        >
          <Presentation className="h-4 w-4" />
          Apresentar
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button 
          onClick={() => onDuplicate(presentation)}
          className="flex items-center justify-center gap-2 border-[2px] border-[#09090B] bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-[#09090B] hover:bg-[#F4F4F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Copy className="h-4 w-4" strokeWidth={2.5} />
          Duplicar
        </button>
        <button 
          onClick={() => onDelete(presentation)}
          className="flex items-center justify-center gap-2 border-[2px] border-[#09090B] bg-[#FF0055] px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#FF4081] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.5} />
          Apagar
        </button>
      </div>
    </div>
  )
}