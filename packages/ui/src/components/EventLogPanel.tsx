import type { GameState } from '@paws/core'
import { formatSimTime } from '../utils/format'

interface Props {
  state: GameState
}

const SQUAD_COLORS: Record<string, string> = {
  'KOBRA-1': '#4ecdc4',
  'KOBRA-2': '#f0a500',
}

export function EventLogPanel({ state }: Props) {
  return (
    <section className="event-log">
      <h2 className="panel-title">Event Log</h2>
      {state.eventLog.map((evt, i) => {
        const color = SQUAD_COLORS[evt.squadId] || 'var(--accent)'
        return (
          <div key={`${evt.tick}-${i}`} className="event-log__item">
            <span className="event-log__time">{formatSimTime(evt.simTimeMs)}</span>
            <span style={{ color, fontWeight: 600, marginRight: 6 }}>[{evt.squadId}]</span>
            {evt.message}
          </div>
        )
      })}
    </section>
  )
}
