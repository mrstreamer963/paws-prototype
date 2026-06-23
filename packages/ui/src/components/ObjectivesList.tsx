import type { GameState } from '@paws/core'

interface Props {
  state: GameState
}

const TYPE_BADGE: Record<string, string> = {
  ASSAULT: 'badge--danger',
  RECON: 'badge--medium',
  SALVAGE: 'badge--salvage',
  PATROL: 'badge--ready',
}

export function ObjectivesList({ state }: Props) {
  return (
    <section className="panel-section">
      <h2 className="panel-title">Objectives</h2>
      {state.missionPool.map((target) => {
        const assignedSquad = state.squads.find((s) => s.missionTargetId === target.id)
        const badgeClass = `badge ${TYPE_BADGE[target.type] || 'badge--medium'}`

        return (
          <div key={target.id} className="card">
            <div className="card__title">
              {assignedSquad ? `${assignedSquad.id} — ${target.label}` : target.label}
            </div>
            <div className="card__meta">
              <span className={badgeClass}>{target.type}</span>
              {assignedSquad && <span> · {assignedSquad.doctrine}</span>}
            </div>
          </div>
        )
      })}
      {state.missionPool.length === 0 && (
        <div className="card">
          <div className="card__title">ALL AT BASE</div>
          <div className="card__meta">
            <span>Ready for next deployment</span>
          </div>
        </div>
      )}
    </section>
  )
}
