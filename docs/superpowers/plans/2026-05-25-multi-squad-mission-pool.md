# Multi-Squad + Mission Pool

**Date:** 2026-05-25
**Status:** Design

## Goal

Expand single-squad idle loop to two squads operating independently, with a mission pool and pulse-type doctrines. Each squad picks targets based on doctrine, maintains own phase FSM, and logs to a shared event log.

## Design

### 1. SquadState → SquadState[]

```ts
interface SquadState {
  id: 'KOBRA-1' | 'KOBRA-2'
  name: string
  readiness: number
  doctrine: 'ASSAULT' | 'RECON' | 'PATROL'
  units: UnitState[]
  cargo: ItemStack[]
  // FSM state
  phase: GamePhase
  phaseTimeLeftMs: number
  missionProgress: number
  missionTargetId: string | null
}
```

- `squads: SquadState[]` replaces single `squad`
- KOBRA-1 doctrine: ASSAULT (prefers assault missions)
- KOBRA-2 doctrine: RECON (prefers recon missions)
- Each squad tracks own phase, progress, target independently

### 2. Mission Pool

```ts
interface MissionTarget {
  id: string
  nodeId: string
  label: string
  type: 'ASSAULT' | 'RECON' | 'PATROL'
  x: number
  y: number
}
```

- Pool size: 3 targets
- Generation: on pool empty → generate 3 new targets with random types (weighted: 40% PATROL, 35% RECON, 25% ASSAULT)
- Each target tied to a `mapNodes` entry
- Completed targets removed from pool

### 3. Pulse Types

Each type modifies mission behavior:

| Type | Duration | Events | Penalty | Loot |
|------|----------|--------|---------|------|
| PATROL | 30s | loot, breakdown | Low (5%) | 50% |
| RECON | 45s | encounter, detection, loot, breakdown | Medium (10%) | 100% |
| ASSAULT | 60s | encounter, breakdown (x2 rate) | High (15%) | 200% |

- `detection` — new event type (stealth, no readiness loss, but may trigger encounter)
- Duration stored in `missionTarget`
- Event rates scaled by type
- Loot multipliers applied on `loot` event

### 4. Doctrine-Based Target Selection

When squad enters `AtBase` → `Deploying`:

1. Filter pool by doctrine match: targets where `target.type === squad.doctrine`
2. If matches exist → pick the one with highest readiness potential (closest to HQ)
3. If no exact match → fallback to next-best type in priority chain:
   - ASSAULT: ASSAULT → RECON → PATROL
   - RECON: RECON → PATROL → ASSAULT
   - PATROL: PATROL → RECON → ASSAULT
4. If pool empty → trigger regeneration

Target assigned to `squad.missionTargetId`, target removed from pool.

### 5. Mission Logic per Type

On `InMission`:

```
missionProgress = 0 → 1 over MISSION_DURATION (per type)

Event roll every EVENT_INTERVAL_MS:
  - Roll random event based on type:
    PATROL: 40% loot, 60% breakdown
    RECON: 30% encounter, 30% detection, 30% loot
    ASSAULT: 50% encounter, 50% breakdown
  - Apply event modifiers (penalty %, loot multiplier)
  - Push event to shared eventLog with [SQUAD_ID] prefix
```

On mission end (`missionProgress >= 1`):

1. Calculate `readinessAfter`
2. Build `MissionReport` per squad
3. Set phase → `Returning`
4. On `Returning` complete → `MissionReport` phase
5. On `MissionReport` complete → `AtBase`
6. On `AtBase`: if `readiness < 80%` → extend resupply by 5s

### 6. Event Log (Shared)

```ts
interface GameEvent {
  tick: number
  simTimeMs: number
  squadId: string  // NEW
  type: 'encounter' | 'loot' | 'breakdown' | 'detection' | 'phase' | 'resupply'
  message: string
}
```

- All events from all squads in single FIFO log (max 20)
- UI prefixes: `[KOBRA-1]` / `[Kobral-2]`
- Timestamps in simTimeMs

### 7. GameState Changes

```ts
interface GameState {
  // ... existing fields ...
  squads: SquadState[]       // NEW: was single `squad`
  squad: SquadState          // DEPRECATED: kept for UI compat during transition
  missionPool: MissionTarget[] // NEW
  missionIndex: number        // total missions completed by all squads
}
```

### 8. UI Updates

- **SquadList** → show 2 rows with phase, readiness, doctrine
- **EventLogPanel** → `[KOBRA-1]` prefix on events
- **MissionMap** → 2 squad markers, colored by doctrine
- **PhaseBanner** → show active squad banners (max 2)
- **HeaderBar** → `squads: 2/2` status
- Remove single `squad` references, use `squads` everywhere

### 9. Testing

- Both squads cycle independently, each picks own target
- Different doctrines → different target priorities
- Pulse types → different durations, event rates, loot amounts
- Shared event log interleaves events correctly
- Pool regeneration works when both squads deplete pool
- ReadyForNextMission works independently per squad

## Success Criteria

- [ ] `pnpm dev` shows 2 squads on map, each cycling independently
- [ ] KOBRA-1 (ASSAULT) picks ASSAULT targets first
- [ ] KOBRA-2 (RECON) picks RECON targets first
- [ ] Mission pool regenerates when empty
- [ ] Event log shows [KOBRA-1] / [KOBRA-2] prefixes
- [ ] Pulse type affects event rates and durations
- [ ] All tests pass
