import { MAP_EDGES, getHqPosition, type GameState, type SquadState } from '@paws/core'

const SQUAD_COLORS: Record<string, string> = {
  'KOBRA-1': '#4ecdc4',
  'KOBRA-2': '#f0a500',
}

function getSquadPosition(squad: SquadState): { x: number; y: number } | null {
  if (squad.phase !== 'InMission' && squad.phase !== 'Returning' && squad.phase !== 'Deploying') {
    return null
  }
  const hq = getHqPosition()
  if (squad.missionTargetId) {
    // Find target position from mission pool
    return { x: hq.x, y: hq.y } // fallback
  }
  return hq
}

export function drawMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
): void {
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const w = width / dpr
  const h = height / dpr

  ctx.fillStyle = '#0b0f12'
  ctx.fillRect(0, 0, w, h)

  const scaleX = w / 800
  const scaleY = h / 500
  const sx = (x: number) => x * scaleX
  const sy = (y: number) => y * scaleY

  const nodeById = Object.fromEntries(state.mapNodes.map((n) => [n.id, n]))

  ctx.strokeStyle = '#1e2a36'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  for (const [a, b] of MAP_EDGES) {
    const na = nodeById[a]
    const nb = nodeById[b]
    if (!na || !nb) continue
    ctx.beginPath()
    ctx.moveTo(sx(na.x), sy(na.y))
    ctx.lineTo(sx(nb.x), sy(nb.y))
    ctx.stroke()
  }
  ctx.setLineDash([])

  for (const node of state.mapNodes) {
    const isHq = node.id === 'hq'

    // Check if any squad has this node as objective
    let isTarget = false
    for (const squad of state.squads) {
      if (squad.missionTargetId && squad.missionTargetX === node.x && squad.missionTargetY === node.y) {
        isTarget = true
        break
      }
    }

    ctx.beginPath()
    ctx.arc(sx(node.x), sy(node.y), isTarget ? 10 : 7, 0, Math.PI * 2)
    ctx.fillStyle = isHq ? '#4ecdc4' : isTarget ? '#f0a500' : '#2a3848'
    ctx.fill()
    ctx.strokeStyle = isTarget ? '#f0a500' : '#4ecdc4'
    ctx.lineWidth = isHq || isTarget ? 2 : 1
    ctx.stroke()

    ctx.fillStyle = '#6b7d8a'
    ctx.font = '11px Rajdhani, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(node.label, sx(node.x), sy(node.y) + 22)
  }

  // Draw squad markers
  for (const squad of state.squads) {
    const pos = getSquadPosition(squad)
    if (!pos) continue

    const hq = getHqPosition()
    let px = hq.x
    let py = hq.y

    if (squad.missionTargetId) {
      const tx = squad.missionTargetX
      const ty = squad.missionTargetY
      if (squad.phase === 'Deploying') {
        const progress = squad.missionProgress
        px = hq.x + (tx - hq.x) * progress
        py = hq.y + (ty - hq.y) * progress
      } else if (squad.phase === 'InMission') {
        px = tx
        py = ty
      } else if (squad.phase === 'Returning') {
        const progress = squad.missionProgress
        px = tx + (hq.x - tx) * (1 - progress)
        py = ty + (hq.y - ty) * (1 - progress)
      }
    }

    const color = SQUAD_COLORS[squad.id] || '#4ecdc4'
    ctx.beginPath()
    ctx.moveTo(sx(px), sy(py) - 10)
    ctx.lineTo(sx(px) - 8, sy(py) + 8)
    ctx.lineTo(sx(px) + 8, sy(py) + 8)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()

    // Label
    ctx.fillStyle = color
    ctx.font = 'bold 10px Rajdhani, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(squad.id, sx(px), sy(py) - 14)
  }
}
