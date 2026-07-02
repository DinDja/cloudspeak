import { MessageSquareText } from 'lucide-react'

export default function OpenTextResults({ responses }) {
  if (responses.length === 0) {
    return (
      <div className="mt-10 text-center text-2xl font-black uppercase tracking-wider text-slate-500">Aguardando respostas...</div>
    )
  }
  return (
    <div className="columns-1 gap-6 space-y-6 text-left md:columns-2 lg:columns-3">
      {responses.map((entry) => (
        <article
          key={entry.id}
          className="break-inside-avoid border-[3px] border-[#09090B] bg-white p-8 shadow-[4px_4px_0px_0px_#09090B] transition-all duration-100 hover:shadow-[6px_6px_0px_0px_#09090B] hover:-translate-x-[1px] hover:-translate-y-[1px]"
        >
          <MessageSquareText className="mb-4 h-8 w-8 text-brand-400 opacity-60" />
          <p className="text-2xl font-bold leading-snug text-slate-800">{entry.value}</p>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-8 w-8 border-2 border-[#09090B] bg-slate-300" />
            <span className="text-sm font-black uppercase tracking-widest text-slate-500">
              {entry.participantName || 'Anônimo'}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
