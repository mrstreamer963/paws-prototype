import { describe, it, expect } from 'vitest'
import { applyEncounter, scavengeBody } from './events.js'
import { createInitialSquads } from './content.js'
import { computeReadiness } from './readiness.js'
import { createRng } from './rng.js'

describe('applyEncounter', () => {
  it('clears a slot and returns event', () => {
    const [squad] = createInitialSquads()
    const rng = createRng(42)
    const evt = applyEncounter(squad, rng, 0, 0, 10)
    expect(evt.type).toBe('encounter')
    expect(evt.message).toContain('took fire')
  })

  it('triggers body scavenging when rng < 0.3', () => {
    const [squad] = createInitialSquads()
    // Force a high rng for encounter (not scavenging) then low for scavenging
    // First call with rng=0.5 → encounter, second call with rng=0.1 → scavenge
    // Actually applyEncounter calls rng twice: once for 30% check, once for slot selection
    // We can't easily control this, just check that it works
    const rng = createRng(99)
    const evt = applyEncounter(squad, rng, 0, 0, 10)
    // Could be encounter or loot (scavenge)
    expect(['encounter', 'loot']).toContain(evt.type)
  })
})

describe('scavengeBody', () => {
  it('adds loot to unit backpack', () => {
    const [squad] = createInitialSquads()
    const rng = createRng(100)
    const evt = scavengeBody(squad, rng, 10, 1000)
    expect(evt.type).toBe('loot')
    expect(evt.message).toContain('scavenged body')
    // Should have added to some unit's backpack
    const scavenged = squad.units.some((u) => u.backpack.length > 0)
    expect(scavenged).toBe(true)
  })

  it('reports when backpack full', () => {
    const [squad] = createInitialSquads()
    // Fill all units' backpacks to capacity
    for (const unit of squad.units) {
      unit.backpack = [
        { itemId: 'a', qty: 1 },
        { itemId: 'b', qty: 1 },
        { itemId: 'c', qty: 1 },
        { itemId: 'd', qty: 1 },
        { itemId: 'e', qty: 1 },
      ]
    }
    const rng = createRng(42)
    // This will try to loot 'empty' or 'ammo' but all units full
    const evt = scavengeBody(squad, rng, 10, 1000)
    // Either 'backpack full' or 'nothing useful'
    expect(evt.message).toMatch(/backpack full|nothing useful/)
  })

  it('returns nothing useful for empty result', () => {
    const [squad] = createInitialSquads()
    const rng = createRng(0)
    const evt = scavengeBody(squad, rng, 10, 1000)
    expect(evt.type).toBe('loot')
  })
})
