import { MessageSquareText } from 'lucide-react'

export default function OpenTextResults({ responses }) {
  if (responses.length === 0) {
    return (
      <div className="mt-10 text-center text-2xl font-bold text-slate-400">Aguardando respostas...</div>
    )
  }
  return (
    <div className="columns-1 gap-6 space-y-6 text-left md:columns-2 lg:columns-3">
      {responses.map((entry) => (
        <article
          key={entry.id}
          className="break-inside-avoid rounded-4xl border border-white/50 bg-white/70 p-8 shadow-card backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white"
        >
          <MessageSquareText className="mb-4 h-8 w-8 text-brand-400 opacity-60" />
          <p className="text-2xl font-bold leading-snug text-slate-800">{entry.value}</p>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
            <span className="text-sm font-black uppercase tracking-wider text-slate-400">
              {entry.participantName || 'Anônimo'}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
