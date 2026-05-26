export const TICK_STEP_MS = 100
export const DEPLOYING_MS = 5000
export const RETURNING_MS = 5000
export const MISSION_REPORT_MS = 5000
export const BASE_PAUSE_MS = 15000
export const EVENT_INTERVAL_MS = 8000
export const EVENT_LOG_MAX = 20
export const MAP_WIDTH = 800
export const MAP_HEIGHT = 500
export const MISSION_POOL_SIZE = 4
export const READINESS_EXTEND_RESUPPLY = 5000 // extend resupply by 5s if readiness < 80%

export interface MissionTypeConfig {
  durationMs: number
  eventRateModifier: number // 1 = normal, 0.5 = half rate, 2 = double
  penaltyPercent: number
  lootMultiplier: number
  eventWeights: {
    encounter: number
    detection: number
    loot: number
    breakdown: number
  }
}

export const ITEM_WEIGHTS: Record<string, number> = {
  ammo: 1,
  medkit: 1,
  materials: 2,
  scrap: 1,
  fuel: 2,
}

export interface BodyLootEntry {
  itemId: string
  weight: number
  chance: number
}

export const BODY_LOOT_TABLE: BodyLootEntry[] = [
  { itemId: 'ammo', weight: 1, chance: 25 },
  { itemId: 'medkit', weight: 1, chance: 15 },
  { itemId: 'materials', weight: 2, chance: 20 },
  { itemId: 'scrap', weight: 1, chance: 20 },
  { itemId: 'fuel', weight: 2, chance: 10 },
  { itemId: 'empty', weight: 0, chance: 10 },
]

export const BACKPACK_CAPACITY = 5

export const MISSION_TYPE_CONFIGS: Record<MissionType, MissionTypeConfig> = {
  PATROL: {
    durationMs: 30000,
    eventRateModifier: 0.8,
    penaltyPercent: 5,
    lootMultiplier: 0.5,
    eventWeights: { encounter: 0, detection: 0, loot: 40, breakdown: 60 },
  },
  RECON: {
    durationMs: 45000,
    eventRateModifier: 1,
    penaltyPercent: 10,
    lootMultiplier: 1,
    eventWeights: { encounter: 30, detection: 30, loot: 30, breakdown: 10 },
  },
  SALVAGE: {
    durationMs: 25000,
    eventRateModifier: 0.6,
    penaltyPercent: 3,
    lootMultiplier: 3,
    eventWeights: { encounter: 10, detection: 10, loot: 70, breakdown: 10 },
  },
  ASSAULT: {
    durationMs: 60000,
    eventRateModifier: 1.5,
    penaltyPercent: 15,
    lootMultiplier: 2,
    eventWeights: { encounter: 50, detection: 0, loot: 20, breakdown: 30 },
  },
}
