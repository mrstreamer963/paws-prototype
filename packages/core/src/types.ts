export type GamePhase =
  | 'AtBase'
  | 'Deploying'
  | 'InMission'
  | 'Returning'
  | 'MissionReport'

export type PlayerCommand = never

export type SquadId = 'KOBRA-1' | 'KOBRA-2' | 'KOBRA-3'

export type Doctrine = 'ASSAULT' | 'RECON' | 'SALVAGE' | 'PATROL'

export type MissionType = Doctrine

export interface ItemStack {
  itemId: string
  qty: number
}

export interface UnitSlot {
  slotId: string
  itemId: string | null
}

export interface UnitState {
  id: string
  name: string
  role: string
  slots: UnitSlot[]
  backpack: ItemStack[]
  weight: number
}

export interface SquadState {
  id: SquadId
  name: string
  readiness: number
  doctrine: Doctrine
  units: UnitState[]
  cargo: ItemStack[]
  // FSM state
  phase: GamePhase
  phaseTimeLeftMs: number
  missionProgress: number
  missionTargetId: string | null
  missionTargetX: number
  missionTargetY: number
  missionTargetDurationMs: number
  missionElapsedMs: number
  nextEventInMs: number
  missionEvents: GameEvent[]
  readinessAtMissionStart: number
}

export interface MapNode {
  id: string
  label: string
  x: number
  y: number
}

export interface MissionTarget {
  id: string
  nodeId: string
  label: string
  type: MissionType
  x: number
  y: number
  durationMs: number
}

export interface GameEvent {
  tick: number
  simTimeMs: number
  squadId: string
  type: 'encounter' | 'loot' | 'breakdown' | 'detection' | 'phase' | 'resupply'
  message: string
}

export interface MissionReport {
  outcome: 'success' | 'partial' | 'failed'
  durationMs: number
  readinessBefore: number
  readinessAfter: number
  events: GameEvent[]
  lootGained: ItemStack[]
  itemsLost: string[]
  bodyLoot: Array<{ itemId: string; qty: number }>
}

export interface GameState {
  tick: number
  seed: number
  simTimeMs: number
  missionIndex: number
  squads: SquadState[]
  baseStorage: ItemStack[]
  eventLog: GameEvent[]
  lastReport: MissionReport | null
  mapNodes: MapNode[]
  missionPool: MissionTarget[]
}
