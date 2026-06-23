import type { ItemStack, SquadState } from './types.js'
import { getTemplateSlotsForUnit } from './content.js'

function takeFromStorage(storage: ItemStack[], itemId: string): boolean {
  const stack = storage.find((s) => s.itemId === itemId)
  if (!stack || stack.qty <= 0) return false
  stack.qty -= 1
  return true
}

function findOrPush(storage: ItemStack[], itemId: string): ItemStack {
  let stack = storage.find((s) => s.itemId === itemId)
  if (!stack) {
    stack = { itemId, qty: 0 }
    storage.push(stack)
  }
  return stack
}

export function depositCargoToBase(squad: SquadState, baseStorage: ItemStack[]): void {
  for (const cargoStack of squad.cargo) {
    if (cargoStack.qty <= 0) continue
    const stack = findOrPush(baseStorage, cargoStack.itemId)
    stack.qty += cargoStack.qty
  }
  squad.cargo = []
}

export function resupplySquad(squad: SquadState, baseStorage: ItemStack[]): void {
  for (const unit of squad.units) {
    const template = getTemplateSlotsForUnit(unit.id)
    for (const t of template) {
      const slot = unit.slots.find((s) => s.slotId === t.slotId)
      if (!slot) continue
      if (slot.itemId !== t.itemId) {
        if (takeFromStorage(baseStorage, t.itemId)) {
          slot.itemId = t.itemId
        }
      }
    }
  }
}
