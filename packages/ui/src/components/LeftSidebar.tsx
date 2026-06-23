import type { GameState } from '@paws/core'
import { BaseStatusCard } from './BaseStatusCard'
import { ObjectivesList } from './ObjectivesList'
import { SquadList } from './SquadList'

interface Props {
  state: GameState
}

export function LeftSidebar({ state }: Props) {
  return (
    <aside className="app-left">
      <ObjectivesList state={state} />
      <SquadList state={state} />
      <BaseStatusCard />
    </aside>
  )
}
