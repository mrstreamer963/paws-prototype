import type { GameState } from '@paws/core'
import { EventLogPanel } from './EventLogPanel'
import { SquadDetailPanel } from './SquadDetailPanel'

interface Props {
  state: GameState
}

export function RightSidebar({ state }: Props) {
  return (
    <aside className="app-right">
      <SquadDetailPanel state={state} />
      <EventLogPanel state={state} />
    </aside>
  )
}
