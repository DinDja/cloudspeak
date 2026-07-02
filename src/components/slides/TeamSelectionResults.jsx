import { useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import { CHART_PALETTE, TEAM_SELECTION_TYPE } from '../../lib/constants'
import { buildTeamSelectionStats } from '../../lib/validators'
import TeamReportModal from './TeamReportModal'

export default function TeamSelectionResults({ slide, responses }) {
  const [activeTeam, setActiveTeam] = useState(null)

  const teams = useMemo(() => {
    if (!slide || slide.type !== TEAM_SELECTION_TYPE) return []
    return buildTeamSelectionStats(slide, responses)
  }, [slide, responses])

  return (
    <>
      <div className="grid gap-6 text-left md:grid-cols-2 xl:grid-cols-2">
        {teams.map((team) => {
          const fillPercent = team.capacity > 0 ? Math.min(Math.round((team.count / team.capacity) * 100), 100) : 0
          const color = CHART_PALETTE[team._colorIndex % CHART_PALETTE.length]
          return (
            <article
              key={team.id ?? team.name}
              className="border-[3px] border-[#09090B] bg-white p-7 shadow-[4px_4px_0px_0px_#09090B]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-[#09090B]">{team.name}</h3>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    {team.count} de {team.capacity} vagas ocupadas
                  </p>
                </div>
                <span
                  className="border-2 border-[#09090B] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]"
                  style={{ color, backgroundColor: `${color}18` }}
                >
                  {team.isFull ? 'Lotado' : `${team.spotsLeft} vaga${team.spotsLeft === 1 ? '' : 's'}`}
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden border-2 border-[#09090B] bg-white">
                <div
                  className="h-full transition-all duration-700 ease-out border-r-2 border-[#09090B]"
                  style={{
                    width: `${Math.max(fillPercent, team.count > 0 ? 8 : 0)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              {team.members.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTeam({ ...team, color })}
                  className="mt-6 w-full border-2 border-[#09090B] px-4 py-3 text-sm font-black uppercase tracking-[0.15em] transition-all duration-100 hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  style={{ color, backgroundColor: `${color}18` }}
                >
                  Ver participantes ({team.count})
                </button>
              )}
            </article>
          )
        })}
      </div>
      {activeTeam && (
        <TeamReportModal team={activeTeam} color={activeTeam.color} onClose={() => setActiveTeam(null)} />
      )}
    </>
  )
}
