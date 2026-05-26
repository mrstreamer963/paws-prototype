import type { GamePhase } from '@paws/core'

export function formatSimTime(simTimeMs: number): string {
  // Коэффициент замедления: 5 минут реального времени = 5 секунд виртуального
  const timeScale = 60

  // Переводим миллисекунды в секунды
  const totalSeconds = Math.floor((simTimeMs / 1000) * timeScale)

  const h = Math.floor(totalSeconds / 3600) % 24
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDay(simTimeMs: number): number {
  return Math.floor(simTimeMs / 86400) + 1
}

export function phaseToStatus(phase: GamePhase): string {
  switch (phase) {
    case 'AtBase':
      return 'Resupplying'
    case 'Deploying':
      return 'Deploying'
    case 'InMission':
      return 'On Mission'
    case 'Returning':
      return 'Returning'
    case 'MissionReport':
      return 'Debrief'
  }
}

export function phaseToLocation(phase: GamePhase): string {
  switch (phase) {
    case 'AtBase':
    case 'Deploying':
    case 'MissionReport':
      return 'NINE LIVES HQ'
    case 'Returning':
      return 'En route to HQ'
    case 'InMission':
      return 'Field'
  }
}

export function readinessBarClass(pct: number): string {
  if (pct > 80) return 'progress-bar__fill'
  if (pct > 60) return 'progress-bar__fill progress-bar__fill--warn'
  return 'progress-bar__fill progress-bar__fill--danger'
}

export function stackQty(
  storage: { itemId: string; qty: number }[],
  itemId: string,
): number {
  return storage.find((s) => s.itemId === itemId)?.qty ?? 0
}
