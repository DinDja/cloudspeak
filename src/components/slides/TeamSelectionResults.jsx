import { useMemo, useState } from 'react'
import { TEAM_SELECTION_TYPE } from '../../lib/constants'
import { buildTeamSelectionStats } from '../../lib/validators'
import TeamReportModal from './TeamReportModal'

export default function TeamSelectionResults({ slide, responses }) {
  const [activeTeamId, setActiveTeamId] = useState(null)
  const teams = useMemo(
    () => (slide?.type === TEAM_SELECTION_TYPE ? buildTeamSelectionStats(slide, responses) : []),
    [slide, responses],
  )
  const activeTeam = teams.find((team) => (team.id || team.name) === activeTeamId)
  return (
    <>
      <div className="team-results">
        {teams.map((team) => (
          <article key={team.id || team.name}>
            <div className="team-results__heading">
              <h3>{team.name}</h3>
              <span>{team.isFull ? 'Lotado' : `${team.spotsLeft} vagas livres`}</span>
            </div>
            <p>
              {team.count} de {team.capacity} vagas ocupadas
            </p>
            <div className="result-chart__track">
              <div
                style={{ width: `${team.capacity ? Math.min((team.count / team.capacity) * 100, 100) : 0}%` }}
              />
            </div>
            {!!team.members.length && (
              <button type="button" onClick={() => setActiveTeamId(team.id || team.name)}>
                Ver participantes ({team.count}) →
              </button>
            )}
          </article>
        ))}
      </div>
      {activeTeam && (
        <TeamReportModal team={activeTeam} color="#244fe6" onClose={() => setActiveTeamId(null)} />
      )}
    </>
  )
}
