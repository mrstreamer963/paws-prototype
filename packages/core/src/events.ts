import type { GameEvent, SquadState } from './types.js'
import { getTemplateSlotsForUnit } from './content.js'
import type { Rng } from './rng.js'
import { MISSION_TYPE_CONFIGS, BODY_LOOT_TABLE } from './config.js'
import type { MissionType } from './types.js'
import { addLootToUnitBackpack } from './weight.js'

const CONSUMABLE_SLOTS = new Set(['medkit', 'toolkit', 'scanner'])

function addCargo(squad: SquadState, itemId: string, qty: number): void {
  const stack = squad.cargo.find((s) => s.itemId === itemId)
  if (stack) stack.qty += qty
  else squad.cargo.push({ itemId, qty })
}

export function applyEncounter(
  squad: SquadState,
  rng: Rng,
  tick: number,
  simTimeMs: number,
  penaltyPercent: number,
): GameEvent {
  const unit = squad.units[rng.int(0, squad.units.length - 1)]
  const clearable = unit.slots.filter(
    (s) => s.itemId && (s.slotId === 'armor' || CONSUMABLE_SLOTS.has(s.slotId)),
  )
  const target =
    clearable.length > 0
      ? clearable[rng.int(0, clearable.length - 1)]
      : unit.slots[rng.int(0, unit.slots.length - 1)]
  const lost = target.itemId
  target.itemId = null

  // 30% chance to scavenge a body after encounter
  if (rng.next() < 0.3) {
    return scavengeBody(squad, rng, tick, simTimeMs)
  }

  return {
    tick,
    simTimeMs,
    squadId: squad.id,
    type: 'encounter',
    message: `${unit.name} took fire — lost ${lost ?? 'gear'} (${penaltyPercent}% penalty)`,
  }
}

export function scavengeBody(squad: SquadState, rng: Rng, tick: number, simTimeMs: number): GameEvent {
  const totalWeight = BODY_LOOT_TABLE.reduce((sum, e) => sum + e.chance, 0)
  let r = rng.next() * totalWeight

  for (const entry of BODY_LOOT_TABLE) {
    r -= entry.chance
    if (r <= 0) {
      if (entry.itemId === 'empty') {
        return {
          tick,
          simTimeMs,
          squadId: squad.id,
          type: 'loot',
          message: 'Searched a body — nothing useful found',
        }
      }

      const unit = squad.units[rng.int(0, squad.units.length - 1)]
      const qty = rng.int(1, 3)
      const stacked = addLootToUnitBackpack(unit, entry.itemId, qty)

      if (stacked) {
        return {
          tick,
          simTimeMs,
          squadId: squad.id,
          type: 'loot',
          message: `${unit.name} scavenged body — +${qty} ${entry.itemId}`,
        }
      } else {
        return {
          tick,
          simTimeMs,
          squadId: squad.id,
          type: 'loot',
          message: `${unit.name} backpack full — loot left behind`,
        }
      }
    }
  }

  return {
    tick,
    simTimeMs,
    squadId: squad.id,
    type: 'loot',
    message: 'Searched a body — nothing useful found',
  }
}

export function applyLoot(
  squad: SquadState,
  rng: Rng,
  tick: number,
  simTimeMs: number,
  lootMultiplier: number,
): GameEvent {
  const baseQty = rng.int(1, 3)
  const qty = Math.max(1, Math.round(baseQty * lootMultiplier))
  addCargo(squad, 'scrap', qty)
  return {
    tick,
    simTimeMs,
    squadId: squad.id,
    type: 'loot',
    message: `Salvaged ${qty} scrap (${lootMultiplier}x multiplier)`,
  }
}

export function applyBreakdown(
  squad: SquadState,
  rng: Rng,
  tick: number,
  simTimeMs: number,
): GameEvent {
  const unitsWithConsumables = squad.units.filter((u) =>
    u.slots.some((s) => s.itemId && CONSUMABLE_SLOTS.has(s.slotId)),
  )
  const pool =
    unitsWithConsumables.length > 0 ? unitsWithConsumables : squad.units
  const unit = pool[rng.int(0, pool.length - 1)]
  const consumables = unit.slots.filter(
    (s) => s.itemId && CONSUMABLE_SLOTS.has(s.slotId),
  )
  const slot =
    consumables.length > 0
      ? consumables[rng.int(0, consumables.length - 1)]
      : unit.slots.find((s) => s.itemId)!
  const lost = slot.itemId
  slot.itemId = null
  return {
    tick,
    simTimeMs,
    squadId: squad.id,
    type: 'breakdown',
    message: `${unit.name} gear failure — ${lost} unserviceable`,
  }
}

export function applyDetection(
  squad: SquadState,
  rng: Rng,
  tick: number,
  simTimeMs: number,
): GameEvent {
  const unit = squad.units[rng.int(0, squad.units.length - 1)]
  const stealth = unit.slots.some((s) => s.itemId === 'cloak')
  if (stealth && rng.next() > 0.5) {
    return {
      tick,
      simTimeMs,
      squadId: squad.id,
      type: 'detection',
      message: `${unit.name} evaded detection using cloak`,
    }
  }
  // Detection succeeded — no readiness loss but could trigger encounter
  return {
    tick,
    simTimeMs,
    squadId: squad.id,
    type: 'detection',
    message: `${unit.name} detected by enemy scouts — no casualties`,
  }
}

export function rollMissionEvent(
  squad: SquadState,
  rng: Rng,
  tick: number,
  simTimeMs: number,
  missionType: MissionType,
): GameEvent {
  const config = MISSION_TYPE_CONFIGS[missionType]
  const { encounter, detection, loot, breakdown } = config.eventWeights

  // Build weighted event selection
  const events: Array<{ type: string; weight: number }> = []
  if (encounter > 0) events.push({ type: 'encounter', weight: encounter })
  if (detection > 0) events.push({ type: 'detection', weight: detection })
  if (loot > 0) events.push({ type: 'loot', weight: loot })
  if (breakdown > 0) events.push({ type: 'breakdown', weight: breakdown })

  const totalWeight = events.reduce((sum, e) => sum + e.weight, 0)
  let r = rng.next() * totalWeight

  for (const evt of events) {
    r -= evt.weight
    if (r <= 0) {
      switch (evt.type) {
        case 'encounter':
          return applyEncounter(squad, rng, tick, simTimeMs, config.penaltyPercent)
        case 'detection':
          return applyDetection(squad, rng, tick, simTimeMs)
        case 'loot':
          return applyLoot(squad, rng, tick, simTimeMs, config.lootMultiplier)
        case 'breakdown':
          return applyBreakdown(squad, rng, tick, simTimeMs)
      }
    }
  }

  // Fallback to first available
  return applyEncounter(squad, rng, tick, simTimeMs, config.penaltyPercent)
}

export function itemsLostDuringMission(squad: SquadState, before: SquadState): string[] {
  const lost: string[] = []
  for (const unit of squad.units) {
    const template = getTemplateSlotsForUnit(unit.id)
    for (const t of template) {
      const now = unit.slots.find((s) => s.slotId === t.slotId)?.itemId
      const prev = before.units
        .find((u) => u.id === unit.id)
        ?.slots.find((s) => s.slotId === t.slotId)?.itemId
      if (prev && !now) lost.push(`${unit.name}: ${prev}`)
    }
  }
  return lost
}
