import type { SquadState } from './types.js'
import { getTemplateSlotsForUnit } from './content.js'
import { calcWeightPenalty, calcWeight } from './weight.js'

export function computeReadiness(squad: SquadState): number {
  let filled = 0
  let total = 0
  for (const unit of squad.units) {
    const template = getTemplateSlotsForUnit(unit.id)
    for (const t of template) {
      total++
      const slot = unit.slots.find((s) => s.slotId === t.slotId)
      if (slot?.itemId === t.itemId) filled++
    }
  }
  if (total === 0) return 0
  let baseReadiness = Math.round((filled / total) * 100)

  // Apply weight penalty
  const penalty = calcWeightPenalty(calcWeight(squad))
  baseReadiness = Math.max(0, baseReadiness + penalty)

  return baseReadiness
}

export function computeUnitReadiness(unitId: string, slots: SquadState['units'][0]['slots']): number {
  const template = getTemplateSlotsForUnit(unitId)
  if (template.length === 0) return 0
  let filled = 0
  for (const t of template) {
    const slot = slots.find((s) => s.slotId === t.slotId)
    if (slot?.itemId === t.itemId) filled++
  }
  return Math.round((filled / template.length) * 100)
}
