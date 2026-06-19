import Modal from '../ui/Modal'

export default function TeamReportModal({ team, color, onClose }) {
  return (
    <Modal open={Boolean(team)} onClose={onClose} maxWidth="max-w-md">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{team.name}</h2>
          <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            {team.count} de {team.capacity} participantes
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto cs-scroll-thin pr-1">
        {team.members.map((member, idx) => (
          <div
            key={`${team.name}-${member.participantId}`}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
              style={{ backgroundColor: color }}
            >
              {idx + 1}
            </div>
            <span className="text-base font-bold text-slate-800">{member.participantName}</span>
            <span className="ml-auto text-xs font-black uppercase tracking-[0.18em] text-slate-300">confirmado</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
