import type { GameState } from '@paws/core'
import { UnitCard } from './UnitCard'

interface Props {
  state: GameState
}

export function SquadMemberRow({ state }: Props) {
  // Show all squads' members, each squad in its own group
  return (
    <div className="app-squad-row" style={{ flexDirection: 'column', gap: '0.5rem' }}>
      {state.squads.map((squad) => {
        const isDeployed =
          squad.phase === 'InMission' ||
          squad.phase === 'Returning' ||
          squad.phase === 'Deploying'

        return (
          <div key={squad.id}>
            <h3 style={{ color: 'var(--muted)', fontSize: 11, margin: '0 0 4px' }}>
              {squad.name} — {squad.doctrine} {isDeployed ? '⬤' : ''}
            </h3>
            <div className="squad-member-row">
              {squad.units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
