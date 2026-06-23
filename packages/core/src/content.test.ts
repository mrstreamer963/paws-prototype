import { describe, it, expect } from 'vitest'
import { selectTargetForSquad, regenerateMissionPool, createInitialSquads, getSquadUnits, createInitialStorage } from './content.js'
import { MISSION_TYPE_CONFIGS } from './config.js'
import type { MissionTarget, Doctrine } from './types.js'

function makePool(types: Doctrine[]): MissionTarget[] {
  return types.map((type, i) => ({
    id: `t-${i}`,
    nodeId: 'mines',
    label: 'MINES',
    type,
    x: 280,
    y: 120,
    durationMs: type === 'ASSAULT' ? 60000 : type === 'RECON' ? 45000 : 30000,
  }))
}

describe('selectTargetForSquad', () => {
  it('ASSAULT doctrine picks ASSAULT target first', () => {
    const pool = makePool(['PATROL', 'ASSAULT', 'RECON'])
    const result = selectTargetForSquad(pool, 'ASSAULT')
    expect(result?.type).toBe('ASSAULT')
  })

  it('RECON doctrine picks RECON target first', () => {
    const pool = makePool(['ASSAULT', 'RECON', 'PATROL'])
    const result = selectTargetForSquad(pool, 'RECON')
    expect(result?.type).toBe('RECON')
  })

  it('falls back to next priority when exact match absent', () => {
    const pool = makePool(['PATROL', 'ASSAULT'])
    const result = selectTargetForSquad(pool, 'RECON')
    expect(result?.type).toBe('ASSAULT') // RECON → SALVAGE → ASSAULT → PATROL
  })

  it('ASSAULT fallback chain: ASSAULT > RECON > PATROL', () => {
    const onlyPatrol = makePool(['PATROL'])
    expect(selectTargetForSquad(onlyPatrol, 'ASSAULT')?.type).toBe('PATROL')
  })

  it('returns undefined for empty pool', () => {
    expect(selectTargetForSquad([], 'ASSAULT')).toBeUndefined()
  })

  it('KOBRA-1 ASSAULT picks higher-duration target', () => {
    const pool = makePool(['PATROL', 'ASSAULT', 'RECON'])
    const result = selectTargetForSquad(pool, 'ASSAULT')
    expect(result?.type).toBe('ASSAULT')
    expect(result?.durationMs).toBe(60000)
  })
})

describe('regenerateMissionPool', () => {
  it('replaces all targets', () => {
    const pool: MissionTarget[] = [{
      id: 'old-1', nodeId: 'hq', label: 'HQ', type: 'ASSAULT', x: 120, y: 380, durationMs: 60000,
    }, {
      id: 'old-2', nodeId: 'hq', label: 'HQ', type: 'PATROL', x: 120, y: 380, durationMs: 30000,
    }, {
      id: 'old-3', nodeId: 'hq', label: 'HQ', type: 'RECON', x: 120, y: 380, durationMs: 45000,
    }]
    regenerateMissionPool(pool, 99)
    expect(pool).toHaveLength(4)
    for (const t of pool) {
      expect(t.type).toMatch(/^(ASSAULT|RECON|PATROL|SALVAGE)$/)
      expect(t.id).not.toMatch(/^old-/)
    }
  })
})

describe('SALVAGE doctrine', () => {
  it('SALVAGE doctrine picks SALVAGE first', () => {
    const pool = makePool(['PATROL', 'SALVAGE', 'RECON'])
    const result = selectTargetForSquad(pool, 'SALVAGE')
    expect(result?.type).toBe('SALVAGE')
  })

  it('ASSAULT picks SALVAGE over PATROL', () => {
    const pool = makePool(['PATROL', 'SALVAGE'])
    const result = selectTargetForSquad(pool, 'ASSAULT')
    expect(result?.type).toBe('SALVAGE')
  })

  it('MISSION_TYPE_CONFIGS SALVAGE: high loot, low risk', () => {
    const cfg = MISSION_TYPE_CONFIGS.SALVAGE
    expect(cfg.lootMultiplier).toBe(3)
    expect(cfg.penaltyPercent).toBe(3)
    expect(cfg.durationMs).toBe(25000)
    expect(cfg.eventRateModifier).toBe(0.6)
  })
})

describe('geologist unit', () => {
  it('SALVAGE squad gets geologist instead of scout', () => {
    const units = getSquadUnits('SALVAGE')
    const ids = units.map((u) => u.id)
    expect(ids).toContain('geologist')
    expect(ids).not.toContain('scout')
    expect(ids).toContain('medic')
    expect(ids).toContain('engineer')
  })

  it('ASSAULT squad gets scout not geologist', () => {
    const units = getSquadUnits('ASSAULT')
    const ids = units.map((u) => u.id)
    expect(ids).toContain('scout')
    expect(ids).not.toContain('geologist')
  })

  it('SALVAGE squad geologist has drill slot', () => {
    const units = getSquadUnits('SALVAGE')
    const geologist = units.find((u) => u.id === 'geologist')!
    const drillSlot = geologist.slots.find((s) => s.slotId === 'drill')
    expect(drillSlot?.itemId).toBe('drill')
  })

  it('storage includes drill', () => {
    const storage = createInitialStorage()
    const drill = storage.find((s) => s.itemId === 'drill')
    expect(drill?.qty).toBe(3)
  })
})
