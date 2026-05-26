import type {
  ItemStack,
  MapNode,
  SquadState,
  UnitState,
  MissionTarget,
  MissionType,
  SquadId,
  Doctrine,
  GameState,
} from './types.js'
import { MAP_HEIGHT, MAP_WIDTH, MISSION_POOL_SIZE } from './config.js'
import { createRng } from './rng.js'
import { MISSION_TYPE_CONFIGS } from './config.js'

export const MAP_NODES: MapNode[] = [
  { id: 'hq', label: 'NINE LIVES HQ', x: 120, y: 380 },
  { id: 'mines', label: 'OLD MINES', x: 280, y: 120 },
  { id: 'bay7', label: 'BAY-7 STATION', x: 520, y: 200 },
  { id: 'reactor', label: 'REACTOR SITE', x: 680, y: 320 },
  { id: 'depot', label: 'FIELD DEPOT', x: 400, y: 420 },
]

export const MAP_EDGES: [string, string][] = [
  ['hq', 'mines'],
  ['hq', 'depot'],
  ['mines', 'bay7'],
  ['bay7', 'reactor'],
  ['depot', 'bay7'],
]

export interface TemplateSlot {
  slotId: string
  itemId: string
}

const UNIT_DEFS: Array<{
  id: string
  name: string
  role: string
  template: TemplateSlot[]
}> = [
  {
    id: 'medic',
    name: 'DOC WHISKERS',
    role: 'Medic',
    template: [
      { slotId: 'weapon', itemId: 'smg' },
      { slotId: 'armor', itemId: 'light_armor' },
      { slotId: 'medkit', itemId: 'medkit' },
    ],
  },
  {
    id: 'engineer',
    name: 'WRENCH',
    role: 'Engineer',
    template: [
      { slotId: 'weapon', itemId: 'shotgun' },
      { slotId: 'armor', itemId: 'light_armor' },
      { slotId: 'toolkit', itemId: 'toolkit' },
    ],
  },
  {
    id: 'scout',
    name: 'SHADOW',
    role: 'Scout',
    template: [
      { slotId: 'weapon', itemId: 'smg' },
      { slotId: 'armor', itemId: 'cloak' },
      { slotId: 'scanner', itemId: 'scanner' },
    ],
  },
  {
    id: 'geologist',
    name: 'CORE',
    role: 'Geologist',
    template: [
      { slotId: 'weapon', itemId: 'shotgun' },
      { slotId: 'armor', itemId: 'light_armor' },
      { slotId: 'drill', itemId: 'drill' },
    ],
  },
]

export function getTemplateSlotsForUnit(unitId: string): TemplateSlot[] {
  const def = UNIT_DEFS.find((u) => u.id === unitId)
  if (!def) return []
  return def.template
}

function buildUnit(def: (typeof UNIT_DEFS)[0]): UnitState {
  return {
    id: def.id,
    name: def.name,
    role: def.role,
    slots: def.template.map((t) => ({
      slotId: t.slotId,
      itemId: t.itemId,
    })),
    backpack: [],
    weight: 0,
  }
}

export function getSquadUnits(doctrine: Doctrine): UnitState[] {
  if (doctrine === 'SALVAGE') {
    // SALVAGE: medic + engineer + geologist
    return UNIT_DEFS
      .filter((u) => ['medic', 'engineer', 'geologist'].includes(u.id))
      .map(buildUnit)
  }
  // Default: medic + engineer + scout
  return UNIT_DEFS
    .filter((u) => ['medic', 'engineer', 'scout'].includes(u.id))
    .map(buildUnit)
}

export const SQUAD_DEFS: Array<{
  id: SquadId
  name: string
  doctrine: Doctrine
}> = [
  { id: 'KOBRA-1', name: 'KOBRA-1', doctrine: 'ASSAULT' },
  { id: 'KOBRA-2', name: 'KOBRA-2', doctrine: 'RECON' },
  { id: 'KOBRA-3', name: 'KOBRA-3', doctrine: 'SALVAGE' },
]

export function createInitialSquads(): SquadState[] {
  return SQUAD_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    readiness: 100,
    doctrine: def.doctrine,
    units: getSquadUnits(def.doctrine),
    cargo: [],
    phase: 'AtBase' as const,
    phaseTimeLeftMs: 0,
    missionProgress: 0,
    missionTargetId: null,
    missionTargetLabel: null,
    missionTargetX: 0,
    missionTargetY: 0,
    missionTargetDurationMs: 0,
    missionElapsedMs: 0,
    nextEventInMs: 0,
    missionEvents: [],
    readinessAtMissionStart: 100,
  }))
}

export function createInitialStorage(): ItemStack[] {
  return [
    { itemId: 'ammo', qty: 200 },
    { itemId: 'medkit', qty: 10 },
    { itemId: 'toolkit', qty: 5 },
    { itemId: 'drill', qty: 3 },
    { itemId: 'fuel', qty: 80 },
    { itemId: 'materials', qty: 120 },
    { itemId: 'scrap', qty: 0 },
  ]
}

export function getHqPosition(): { x: number; y: number } {
  const hq = MAP_NODES.find((n) => n.id === 'hq')!
  return { x: hq.x, y: hq.y }
}

export function rollObjective(
  rng: { int(min: number, max: number): number },
): { x: number; y: number } {
  const pois = MAP_NODES.filter((n) => n.id !== 'hq')
  const node = pois[rng.int(0, pois.length - 1)]
  return { x: node.x, y: node.y }
}

export function objectiveLabel(objective: { x: number; y: number }): string {
  let best = MAP_NODES[0]
  let bestDist = Infinity
  for (const node of MAP_NODES) {
    const dx = node.x - objective.x
    const dy = node.y - objective.y
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      best = node
    }
  }
  return best.label
}

export function clampObjective(pos: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.max(40, Math.min(MAP_WIDTH - 40, pos.x)),
    y: Math.max(40, Math.min(MAP_HEIGHT - 40, pos.y)),
  }
}

// Mission pool helpers

const DOCTRINE_PRIORITY: Record<Doctrine, Doctrine[]> = {
  ASSAULT: ['ASSAULT', 'RECON', 'SALVAGE', 'PATROL'],
  RECON: ['RECON', 'SALVAGE', 'ASSAULT', 'PATROL'],
  SALVAGE: ['SALVAGE', 'PATROL', 'RECON', 'ASSAULT'],
  PATROL: ['PATROL', 'SALVAGE', 'RECON', 'ASSAULT'],
}

export function createInitialMissionPool(seed: number): MissionTarget[] {
  const rng = createRng(seed)
  return generateMissionPool(rng, seed)
}

function generateMissionPool(rng: ReturnType<typeof createRng>, _seed: number): MissionTarget[] {
  const types: MissionType[] = ['PATROL', 'RECON', 'SALVAGE', 'ASSAULT']
  const weights = [0.35, 0.25, 0.25, 0.15]
  const pool: MissionTarget[] = []
  const pois = MAP_NODES.filter((n) => n.id !== 'hq')

  for (let i = 0; i < pois.length; i++) {
    const type = weightedRoll(types, weights, rng)
    const node = pois[i]
    pool.push({
      id: `target-${i}`,
      nodeId: node.id,
      label: node.label,
      type,
      x: node.x,
      y: node.y,
      durationMs: MISSION_TYPE_CONFIGS[type].durationMs,
    })
  }
  return pool
}

function weightedRoll(
  items: MissionType[],
  weights: number[],
  rng: ReturnType<typeof createRng>,
): MissionType {
  const r = rng.next()
  let cumulative = 0
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i]
    if (r < cumulative) return items[i]
  }
  return items[items.length - 1]
}

export function selectTargetForSquad(
  pool: MissionTarget[],
  doctrine: Doctrine,
): MissionTarget | undefined {
  const priority = DOCTRINE_PRIORITY[doctrine]
  for (const dtype of priority) {
    const match = pool.find((t) => t.type === dtype)
    if (match) return match
  }
  // Fallback: first available
  return pool.length > 0 ? pool[0] : undefined
}

export function removeTargetFromPool(pool: MissionTarget[], targetId: string): void {
  const idx = pool.findIndex((t) => t.id === targetId)
  if (idx >= 0) pool.splice(idx, 1)
}

export function regenerateMissionPool(
  pool: MissionTarget[],
  seed: number,
): void {
  const rng = createRng(seed + Date.now())
  const types: MissionType[] = ['PATROL', 'RECON', 'SALVAGE', 'ASSAULT']
  const weights = [0.35, 0.25, 0.25, 0.15]
  const pois = MAP_NODES.filter((n) => n.id !== 'hq')
  pool.length = 0

  for (let i = 0; i < pois.length; i++) {
    const type = weightedRoll(types, weights, rng)
    const node = pois[i]
    pool.push({
      id: `target-${Date.now()}-${i}`,
      nodeId: node.id,
      label: node.label,
      type,
      x: node.x,
      y: node.y,
      durationMs: MISSION_TYPE_CONFIGS[type].durationMs,
    })
  }
}
