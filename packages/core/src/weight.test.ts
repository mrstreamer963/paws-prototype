import { describe, it, expect } from 'vitest'
import { calcWeight, calcWeightPenalty, addLootToUnitBackpack, hasBackpackSpace } from './weight.js'
import type { SquadState, UnitState } from './types.js'

function makeUnit(): UnitState {
  return { id: 'test', name: 'Test', role: 'Medic', slots: [], backpack: [], weight: 0 }
}

describe('calcWeight', () => {
  it('returns 0 for empty squad', () => {
    const squad = { units: [] } as SquadState
    expect(calcWeight(squad)).toBe(0)
  })

  it('sums qty * weight for all units backpacks', () => {
    const squad = {
      units: [
        { backpack: [{ itemId: 'ammo', qty: 3 }, { itemId: 'materials', qty: 2 }] },
        { backpack: [{ itemId: 'scrap', qty: 5 }] },
      ] as UnitState[],
    } as SquadState
    expect(calcWeight(squad)).toBe(12) // 3*1 + 2*2 + 5*1
  })
})

describe('calcWeightPenalty', () => {
  it('returns 0 for weight 0-8', () => {
    expect(calcWeightPenalty(0)).toBe(0)
    expect(calcWeightPenalty(5)).toBe(0)
    expect(calcWeightPenalty(8)).toBe(0)
  })

  it('returns -5 for weight 9-12', () => {
    expect(calcWeightPenalty(9)).toBe(-5)
    expect(calcWeightPenalty(12)).toBe(-5)
  })

  it('returns -15 for weight > 12', () => {
    expect(calcWeightPenalty(13)).toBe(-15)
    expect(calcWeightPenalty(20)).toBe(-15)
  })
})

describe('hasBackpackSpace', () => {
  it('returns true when backpack < 5 unique items', () => {
    const unit = makeUnit()
    unit.backpack = [{ itemId: 'ammo', qty: 3 }]
    expect(hasBackpackSpace(unit)).toBe(true)
  })

  it('returns false when backpack has 5 unique items', () => {
    const unit = makeUnit()
    unit.backpack = [
      { itemId: 'a', qty: 1 },
      { itemId: 'b', qty: 1 },
      { itemId: 'c', qty: 1 },
      { itemId: 'd', qty: 1 },
      { itemId: 'e', qty: 1 },
    ]
    expect(hasBackpackSpace(unit)).toBe(false)
  })
})

describe('addLootToUnitBackpack', () => {
  it('adds new item to unit backpack', () => {
    const unit = makeUnit()
    addLootToUnitBackpack(unit, 'scrap', 2)
    expect(unit.backpack).toEqual([{ itemId: 'scrap', qty: 2 }])
  })

  it('stacks qty for existing item', () => {
    const unit = makeUnit()
    unit.backpack = [{ itemId: 'ammo', qty: 2 }]
    addLootToUnitBackpack(unit, 'ammo', 3)
    expect(unit.backpack).toEqual([{ itemId: 'ammo', qty: 5 }])
  })

  it('returns false when backpack full (5 unique)', () => {
    const unit = makeUnit()
    unit.backpack = [
      { itemId: 'a', qty: 1 },
      { itemId: 'b', qty: 1 },
      { itemId: 'c', qty: 1 },
      { itemId: 'd', qty: 1 },
      { itemId: 'e', qty: 1 },
    ]
    const result = addLootToUnitBackpack(unit, 'f', 1)
    expect(result).toBe(false)
    expect(unit.backpack).toHaveLength(5)
  })
})
