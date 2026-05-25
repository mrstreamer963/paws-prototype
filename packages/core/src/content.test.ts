import { describe, it, expect } from 'vitest'
import { selectTargetForSquad, regenerateMissionPool } from './content.js'
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
    expect(result?.type).toBe('PATROL') // RECON → PATROL → ASSAULT
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
    expect(pool).toHaveLength(3)
    for (const t of pool) {
      expect(t.type).toMatch(/^(ASSAULT|RECON|PATROL)$/)
      expect(t.id).not.toMatch(/^old-/)
    }
  })
})
