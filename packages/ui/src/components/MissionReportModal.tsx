import type { GameState } from '@paws/core'

interface Props {
  state: GameState
}

export function MissionReportModal({ state }: Props) {
  const reportSquad = state.squads.find((s) => s.phase === 'MissionReport')
  if (!reportSquad || !state.lastReport) return null

  const report = state.lastReport
  const headline =
    report.outcome === 'success'
      ? 'MISSION SUCCESS'
      : report.outcome === 'partial'
        ? 'MISSION PARTIAL'
        : 'MISSION FAILED'

  return (
    <div className="report-modal-backdrop">
      <div className="report-modal">
        <h2>[{reportSquad.id}] {headline}</h2>
        <p>
          Readiness {report.readinessBefore}% → {report.readinessAfter}%
        </p>
        <p>Duration: {Math.round(report.durationMs / 1000)}s</p>
        {report.events.length > 0 && (
          <>
            <strong>Events</strong>
            <ul>
              {report.events.map((e, i) => {
                const color = e.squadId === 'KOBRA-1' ? '#4ecdc4' : '#f0a500'
                return (
                  <li key={i} style={{ color }}>
                    [{e.squadId}] {e.message}
                  </li>
                )
              })}
            </ul>
          </>
        )}
        {report.lootGained.length > 0 && (
          <p>Loot: {report.lootGained.map((l) => `${l.qty} ${l.itemId}`).join(', ')}</p>
        )}
        {report.itemsLost.length > 0 && (
          <p>Lost: {report.itemsLost.join('; ')}</p>
        )}
        {report.bodyLoot.length > 0 && (
          <>
            <strong>Body Loot</strong>
            <ul>
              {report.bodyLoot.map((loot, i) => (
                <li key={i}>
                  +{loot.qty} {loot.itemId}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
