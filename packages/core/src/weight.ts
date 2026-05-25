import type { SquadState, UnitState, ItemStack } from './types.js'
import { ITEM_WEIGHTS, BACKPACK_CAPACITY } from './config.js'

export function calcWeight(squad: SquadState): number {
  let total = 0
  for (const unit of squad.units) {
    for (const stack of unit.backpack) {
      total += stack.qty * (ITEM_WEIGHTS[stack.itemId] ?? 1)
    }
  }
  return total
}

export function calcWeightPenalty(weight: number): number {
  if (weight > 12) return -15
  if (weight > 8) return -5
  return 0
}

export function hasBackpackSpace(unit: UnitState): boolean {
  return unit.backpack.length < BACKPACK_CAPACITY
}

export function addLootToUnitBackpack(unit: UnitState, itemId: string, qty: number): boolean {
  const stack = unit.backpack.find((s) => s.itemId === itemId)
  if (stack) {
    stack.qty += qty
    return true
  }
  if (!hasBackpackSpace(unit)) return false
  unit.backpack.push({ itemId, qty })
  return true
}
