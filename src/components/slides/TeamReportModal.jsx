import Modal from '../ui/Modal'

export default function TeamReportModal({ team, color, onClose }) {
  return (
    <Modal open={Boolean(team)} onClose={onClose} maxWidth="max-w-md">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#09090B]">{team.name}</h2>
          <p className="mt-1 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            {team.count} de {team.capacity} participantes
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border-2 border-[#09090B] p-2 text-slate-500 transition-all duration-100 hover:bg-[#FF0055] hover:text-white hover:shadow-[2px_2px_0px_0px_#09090B]"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto cs-scroll-thin pr-1">
        {team.members.map((member, idx) => (
          <div
            key={`${team.name}-${member.participantId}`}
            className="flex items-center gap-3 border-2 border-[#09090B] bg-white px-4 py-3 shadow-[2px_2px_0px_0px_#09090B]"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#09090B] text-sm font-black text-white"
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
