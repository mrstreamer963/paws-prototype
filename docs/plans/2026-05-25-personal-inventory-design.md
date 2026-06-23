# Personal Inventory Design

**Date:** 2026-05-25  
**Status:** Approved  
**Reference:** `ideas/log1.txt` — inventory discussion (squad vs personal)

## Goal

Each unit has its own backpack (5 slots). Looting from bodies during missions fills backpacks. Weight affects readiness. Base resupply consumes backpack consumables.

## Design Decisions

| Topic | Choice |
|-------|--------|
| Inventory level | Per-unit (not squad-level cargo) |
| Backpack capacity | 5 unique items |
| Weight system | Yes — `weight > 8 → readiness -5%`, `> 12 → -15%` |
| Body scavenging | Yes — 30% chance per encounter |
| Base resupply | Consumables from backpack auto-used, backpack items preserved |
| Backpack management | Drop to storage at base (no item swap yet) |

---

## 1. Data Model

### UnitState changes

```ts
interface UnitState {
  // ... existing fields
  backpack: ItemStack[]  // NEW: max 5 unique items, qty per stack
  weight: number         // NEW: calculated from backpack items
}
```

- `backpack` max 5 **unique** `itemId` entries
- Each `ItemStack` in backpack: `{ itemId, qty }`
- Weight = `sum(stack.qty * ITEM_WEIGHTS[itemId])`
- Excess loot (backpack full): item dropped, event logged

### New config in content.ts

```ts
export const ITEM_WEIGHTS: Record<string, number> = {
  ammo: 1,
  medkit: 1,
  materials: 2,
  scrap: 1,
  fuel: 2,
  // consumables that go to slots: weight 0 (handled separately)
}

export const BODY_LOOT_TABLE: Array<{
  itemId: string
  weight: number
  chance: number  // probability weight
}> = [
  { itemId: 'ammo', weight: 1, chance: 25 },
  { itemId: 'medkit', weight: 1, chance: 15 },
  { itemId: 'materials', weight: 2, chance: 20 },
  { itemId: 'scrap', weight: 1, chance: 20 },
  { itemId: 'fuel', weight: 2, chance: 10 },
  { itemId: 'empty', weight: 0, chance: 10 },
]
```

### MissionReport changes

```ts
interface MissionReport {
  // ... existing fields
  bodyLoot: Array<{ unitId: string; itemId: string; qty: number }>  // NEW
}
```

Tracks which unit scavenged what from bodies.

---

## 2. Body Scavenging

On `encounter` event (during `InMission`):

```
30% chance → attempt body scavenging
  → roll BODY_LOOT_TABLE
  → if itemId !== 'empty':
    → if backpack has < 5 unique items: add/stack item
    → else: event "Backpack full — loot left behind"
  → unit.weight recalculated
```

- Loot is assigned to the unit involved in the encounter
- If encounter hits random unit, that unit gets the loot
- `empty` result = no loot found (no event, just no loot)

---

## 3. Weight & Readiness

```ts
function calcWeightPenalty(weight: number): number {
  if (weight > 12) return -15
  if (weight > 8) return -5
  return 0
}
```

Applied in `computeReadiness`:
1. Base readiness from static slot filling (as before)
2. Subtract weight penalty

---

## 4. Resupply (AtBase)

`resupplySquad` updated:

1. Fill static slots from `baseStorage` (existing logic)
2. Backpack items **not** removed automatically
3. **But** backpack consumables (ammo, medkit, fuel, materials):
   - Each unit consumes 1 of each per resupply cycle from storage
   - If backpack has `ammo:3` and storage has ammo: reduce backpack `ammo:3` → `ammo:0`, storage unchanged (already handled by slot fill)
   - Simpler: backpack consumables are "used up" during mission, resupply refills slots (not backpack)
   - Backpack items persist across missions
4. `weight` recalculated after resupply = `sum(backpack qty * weight)`

---

## 5. UI Changes

### UnitCard

```
┌─────────────────────┐
│ 🩺 DOC WHISKERS      │
│ Medic                │
│ SMG ARM MED          │
│ ───────────────────  │
│ 🎒 ammo:3 med:1     │  ← backpack items (max 3 shown)
│ scrap:2              │
│ ───────────────────  │
│ ⚖ 6                  │  ← weight
│ ═══════════░░░░      │  ← readiness bar
└─────────────────────┘
```

- Backpack: show up to 3 items, `...+2` if more
- Weight: number only (no bar)
- Weight penalty reflected in readiness bar color

### MissionReportModal

New section at bottom:

```
── Body Loot ──────────────────────
DOC WHISKERS  +3 ammo, +1 medkit
WRENCH        +2 materials
SHADOW        +1 scrap
```

### SquadDetailPanel

New button below template dropdown:

```
[ MANAGE BACKPACKS ]
```

Expands to show table:

| Unit | Backpack Items | Weight |
|------|---------------|--------|
| DOC WHISKERS | ammo:3, med:1 | 4 |
| WRENCH | materials:2, scrap:1 | 5 |
| SHADOW | ammo:5 | 5 |

(YAGNI: drop functionality — just view for now)

---

## 6. Testing

| # | Test |
|---|------|
| 1 | Backpack never exceeds 5 unique items |
| 2 | Encounter with body scavenging adds item to backpack |
| 3 | Backpack full → loot dropped, event logged |
| 4 | weight > 8 → readiness -5% |
| 5 | weight > 12 → readiness -15% |
| 6 | Resupply does not remove backpack items |
| 7 | MissionReport.bodyLoot tracks per-unit loot |
| 8 | Sim: unit scavenges → weight↑ → readiness↓ |

---

## 7. Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/types.ts` | Add `backpack`, `weight` to `UnitState` |
| `packages/core/src/config.ts` | Add `ITEM_WEIGHTS`, `BODY_LOOT_TABLE` |
| `packages/core/src/content.ts` | Init `backpack: []`, `weight: 0` in unit creation |
| `packages/core/src/resupply.ts` | Preserve backpack, recalc weight |
| `packages/core/src/events.ts` | `scavengeBody()` function, integrate into encounter flow |
| `packages/core/src/readiness.ts` | `calcWeightPenalty()`, apply to readiness |
| `packages/core/src/game.ts` | Init backpack/weight, pass through events |
| `packages/ui/src/components/UnitCard.tsx` | Show backpack + weight |
| `packages/ui/src/components/MissionReportModal.tsx` | Body loot section |
| `packages/ui/src/components/SquadDetailPanel.tsx` | "Manage Backpacks" button |

---

## 8. Success Criteria

- [ ] Each unit shows backpack items in UnitCard
- [ ] Encounter events trigger body scavenging 30% of time
- [ ] Weight penalty visible in readiness bar
- [ ] Backpack never exceeds 5 unique items
- [ ] MissionReport shows body loot breakdown
- [ ] Backpack persists between missions
- [ ] All existing tests still pass
- [ ] 8 new tests pass
