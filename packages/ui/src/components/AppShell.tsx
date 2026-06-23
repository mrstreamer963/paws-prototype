import type { GameState } from '@paws/core'
import { HeaderBar } from './HeaderBar'
import { LeftSidebar } from './LeftSidebar'
import { MissionMap } from './MissionMap'
import { RightSidebar } from './RightSidebar'
import { SquadMemberRow } from './SquadMemberRow'

interface Props {
  state: GameState
  isPlaying: boolean
  speed: number
  setPlaying: (v: boolean) => void
  cycleSpeed: () => void
}

export function AppShell({ state, isPlaying, speed, setPlaying, cycleSpeed }: Props) {
  return (
    <div className="app-shell">
      <HeaderBar state={state} isPlaying={isPlaying} speed={speed} setPlaying={setPlaying} cycleSpeed={cycleSpeed} />
      <LeftSidebar state={state} />
      <MissionMap state={state} />
      <RightSidebar state={state} />
      <SquadMemberRow state={state} />
    </div>
  )
}
