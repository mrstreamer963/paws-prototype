import type { GameState } from '@paws/core'

interface Props {
  state: GameState
}

const PHASE_LABELS: Record<string, string> = {
  AtBase: 'RESUPPLYING…',
  Deploying: 'DEPLOYING',
  InMission: 'ON MISSION',
  Returning: 'RETURNING TO HQ',
  MissionReport: 'MISSION DEBRIEF',
}

export function PhaseBanner({ state }: Props) {
  const activeSquads = state.squads.filter(
    (s) => s.phase !== 'AtBase' && s.phase !== 'MissionReport',
  )

  if (activeSquads.length === 0) {
    const atBase = state.squads.find((s) => s.phase === 'AtBase')
    if (!atBase) return null
    const sec = Math.ceil(atBase.phaseTimeLeftMs / 1000)
    // return <div className="phase-banner">{PHASE_LABELS.AtBase} {sec}s</div>
  }

  // return (
  //   <div className="phase-banner">
  //     {activeSquads.map((s) => {
  //       const label = PHASE_LABELS[s.phase] || s.phase
  //       if (s.phase === 'AtBase') {
  //         const sec = Math.ceil(s.phaseTimeLeftMs / 1000)
  //         return (
  //           <span key={s.id}>
  //             [{s.id}] {label} {sec}s
  //           </span>
  //         )
  //       }
  //       return <span key={s.id}>[{s.id}] {label}</span>
  //     }).reduce((prev, curr, i, arr) => i === 0 ? curr : (
  //       <span>
  //         {prev} | {curr}
  //       </span>
  //     ))}
  //   </div>
  // )
}
