import type { GameState } from '@paws/core'
import { HeaderBar } from './HeaderBar'
import { LeftSidebar } from './LeftSidebar'
import { MissionMap } from './MissionMap'
import { RightSidebar } from './RightSidebar'
import { SquadMemberRow } from './SquadMemberRow'
import { FullscreenPanel } from './FullscreenPanel'
import { usePanelState } from '../hooks/usePanelState'

interface Props {
  state: GameState
  isPlaying: boolean
  speed: number
  setPlaying: (v: boolean) => void
  cycleSpeed: () => void
}

export function AppShell({ state, isPlaying, speed, setPlaying, cycleSpeed }: Props) {
  const { leftOpen, rightOpen, toggleLeft, toggleRight } = usePanelState()

  return (
    <div className="app-shell">
      <HeaderBar
        state={state}
        isPlaying={isPlaying}
        speed={speed}
        setPlaying={setPlaying}
        cycleSpeed={cycleSpeed}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={toggleLeft}
        onToggleRight={toggleRight}
      />

      {leftOpen && (
        <LeftSidebar state={state} />
      )}

      <FullscreenPanel title="Mission Map">
        <MissionMap state={state} />
      </FullscreenPanel>

      {rightOpen && (
        <RightSidebar state={state} />
      )}

      <SquadMemberRow state={state} />
    </div>
  )
}