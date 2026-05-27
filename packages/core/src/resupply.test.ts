import { describe, it, expect } from 'vitest'
import { resupplySquad, depositCargoToBase } from './resupply.js'
import { createInitialSquads, createInitialStorage } from './content.js'

describe('depositCargoToBase', () => {
  it('moves scrap from squad cargo to base storage', () => {
    const [squad] = createInitialSquads()
    squad.cargo.push({ itemId: 'scrap', qty: 10 })
    const storage = createInitialStorage()
    depositCargoToBase(squad, storage)
    expect(storage.find((s) => s.itemId === 'scrap')!.qty).toBe(10)
    expect(squad.cargo.length).toBe(0)
  })

  it('stacks with existing base storage', () => {
    const [squad] = createInitialSquads()
    squad.cargo.push({ itemId: 'scrap', qty: 5 })
    const storage = [{ itemId: 'scrap', qty: 7 }]
    depositCargoToBase(squad, storage)
    expect(storage.find((s) => s.itemId === 'scrap')!.qty).toBe(12)
    expect(squad.cargo.length).toBe(0)
  })

  it('handles multiple item types', () => {
    const [squad] = createInitialSquads()
    squad.cargo.push({ itemId: 'scrap', qty: 3 }, { itemId: 'fuel', qty: 4 })
    const storage: Array<{ itemId: string; qty: number }> = []
    depositCargoToBase(squad, storage)
    expect(storage.find((s) => s.itemId === 'scrap')!.qty).toBe(3)
    expect(storage.find((s) => s.itemId === 'fuel')!.qty).toBe(4)
    expect(squad.cargo.length).toBe(0)
  })

  it('no-op when cargo is empty', () => {
    const [squad] = createInitialSquads()
    const storage = createInitialStorage()
    const baseScrap = storage.find((s) => s.itemId === 'scrap')!.qty
    depositCargoToBase(squad, storage)
    expect(squad.cargo.length).toBe(0)
    expect(storage.find((s) => s.itemId === 'scrap')!.qty).toBe(baseScrap)
  })
})

describe('resupplySquad', () => {
  it('refills medkit from base storage', () => {
    const [squad] = createInitialSquads()
    const medic = squad.units.find((u) => u.id === 'medic')!
    medic.slots.find((s) => s.slotId === 'medkit')!.itemId = null
    const storage = createInitialStorage()
    resupplySquad(squad, storage)
    expect(medic.slots.find((s) => s.slotId === 'medkit')!.itemId).toBe('medkit')
    const medStack = storage.find((s) => s.itemId === 'medkit')
    expect(medStack!.qty).toBeLessThan(10)
  })
})
