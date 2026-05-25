import { describe, it, expect } from 'vitest'
import { computeReadiness } from './readiness.js'
import { createInitialSquads } from './content.js'

describe('computeReadiness', () => {
  it('returns 100 when all template slots filled and no weight penalty', () => {
    const squads = createInitialSquads()
    const squad = squads[0]
    expect(computeReadiness(squad)).toBe(100)
  })

  it('drops when a consumable slot is empty', () => {
    const squads = createInitialSquads()
    const squad = squads[0]
    squad.units[0].slots.find((s) => s.slotId === 'medkit')!.itemId = null
    expect(computeReadiness(squad)).toBeLessThan(100)
  })

  it('applies weight penalty', () => {
    const squads = createInitialSquads()
    const squad = squads[0]
    squad.units.forEach((u) => {
      u.backpack = [
        { itemId: 'ammo', qty: 10 },
        { itemId: 'materials', qty: 5 },
      ]
    })
    // weight per unit = 10*1 + 5*2 = 20
    // 3 units = 60 total → penalty -15
    const ready = computeReadiness(squad)
    expect(ready).toBeLessThan(100)
    expect(ready).toBe(85)
  })
})
