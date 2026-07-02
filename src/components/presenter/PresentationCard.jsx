import { FilePenLine, Presentation } from 'lucide-react'

export default function PresentationCard({ presentation }) {
  const { title, slides, updatedAt } = presentation
  const slidesCount = slides?.length || 0
  const lastUpdated = new Date(updatedAt?.seconds * 1000).toLocaleDateString('pt-BR')

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
        <button className="cs-btn-base h-11 gap-2 bg-[#FCFBF9] px-4 text-sm font-bold text-[#09090B]">
          <FilePenLine className="h-4 w-4" />
          Editar
        </button>
        <button className="cs-btn-base h-11 gap-2 bg-[#09090B] px-4 text-sm font-black text-white">
          <Presentation className="h-4 w-4" />
          Apresentar
        </button>
      </div>
    </div>
  )
}