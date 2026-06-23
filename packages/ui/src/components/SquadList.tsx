import type { GameState } from '@paws/core'
import { phaseToStatus, readinessBarClass } from '../utils/format'

interface Props {
  state: GameState
}

export function SquadList({ state }: Props) {
  return (
    <section className="panel-section">
      <h2 className="panel-title">Squads</h2>
      {state.squads.map((squad) => {
        const status = phaseToStatus(squad.phase)
        const badgeClass =
          squad.phase === 'AtBase'
            ? 'badge badge--ready'
            : squad.phase === 'InMission'
              ? 'badge badge--mission'
              : 'badge'

        return (
          <div key={squad.id} className="squad-list-item">
            <div>
              <strong>{squad.name}</strong>
              <div>
                <span className={badgeClass}>{status}</span>
                <span className="badge" style={{ marginLeft: 4, fontSize: 10 }}>
                  {squad.doctrine}
                </span>
              </div>
            </div>
            <div className="squad-list-item__bar">
              <div className="progress-bar">
                <div
                  className={readinessBarClass(squad.readiness)}
                  style={{ width: `${squad.readiness}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
