# PAWS Prototype — Minimal MVP Design

**Date:** 2026-05-23  
**Status:** Implemented (verified 2026-05-23)  
**Reference mockup:** `ideas/ChatGPT Image 21 мая 2026 г., 21_49_13.png`

## Goal

Smallest playable idle loop that validates the product direction and supports layering future systems (doctrine, warehouse, multi-squad, WASM core).

**Player experience:** open browser → watch KOBRA-1 auto-deploy → mission with events → return → resupply pause → repeat. No configuration.

## Non-Goals (MVP)

- Save/load (`localStorage`) — later
- Player commands (send squad, pick doctrine, manual resupply)
- Multi-squad, factions, intel map, vehicles tab
- Tile tactical combat, inventory drag-and-drop
- Art assets (portraits are placeholders)
- Rust/WASM (architecture prepares for it; implementation stays TypeScript in `packages/core` first)

## Decisions Summary

| Topic | Choice |
|-------|--------|
| Core loop | Squad on map → autonomous mission → text report → base resupply → repeat |
| During mission | Watch only (idle) |
| Platform | Browser, `pnpm run dev` |
| Architecture | Monorepo: `@paws/core` + `@paws/ui` |
| Core future | Port to Rust/WASM; same `GameState` schema |
| Mission model | Move to objective; random events; narrative log |
| Pre-mission setup | None — fully automatic |
| Base phase | Fixed pause (15s) with visible resupply |
| Persistence | None |
| UI | React + CSS; Canvas for tactical map only |
| Visual target | NINE LIVES CORP mockup layout (controls stubbed/disabled) |

---

## 1. Architecture

```
paws-prototype/
  package.json              # pnpm workspaces root
  packages/
    core/                   # @paws/core — pure simulation
    ui/                     # @paws/ui — Vite + React
  docs/superpowers/specs/
```

### Core boundary (WASM-ready)

- **No** `window`, DOM, `fetch`, or host timers inside core
- **API:**
  - `createGame(options?: { seed?: number }): Game`
  - `game.tick(dtMs: number): void` — accumulates fixed substeps (100ms)
  - `game.getState(): GameState` — JSON-serializable snapshot
  - `type PlayerCommand = never` in MVP (exported for future UI → core commands)
- **Determinism:** `seed` + tick count → reproducible `eventLog` (unit tests)
- **Errors:** core never throws during `tick`; invalid internal state is prevented by construction

### UI package

- Vite + React + TypeScript
- `useGameLoop`: `requestAnimationFrame` → accumulate `dt` → call `tick` → `setState(getState())`
- Imports **only** `@paws/core`
- Root `ErrorBoundary` for render failures

### Tooling

- pnpm workspaces
- vitest in `packages/core` (required)
- vitest + jsdom in `packages/ui` (optional smoke test)

---

## 2. Core Simulation

### Phase state machine

```
AtBase → Deploying → InMission → Returning → MissionReport → AtBase
```

| Phase | Duration | Behavior |
|-------|----------|----------|
| `Deploying` | 2s | Squad at HQ; UI shows departure |
| `InMission` | 45s (`MISSION_DURATION_MS`) | `missionProgress` 0→1; periodic events |
| `Returning` | 5s | Progress back toward HQ |
| `MissionReport` | 5s | Freeze `lastReport` for UI |
| `AtBase` | 15s (`BASE_PAUSE_MS`) | Resupply units/cargo toward template |

After `AtBase` timer elapses, core auto-starts next mission (no player input).

### Mission (InMission)

- One objective point per mission: random `(x, y)` within map bounds (RNG from `seed` + mission index)
- `missionProgress`: 0..1 — UI interpolates squad icon along HQ→objective line
- Event roll every **8s** of mission time (config constant `EVENT_INTERVAL_MS`)
- Mission ends when `missionProgress >= 1`

### Event types (MVP)

| Type | Effect |
|------|--------|
| `encounter` | Reduce squad `readiness`; log narrative line |
| `loot` | Add item stack to `squad.cargo` |
| `breakdown` | Remove one consumable from random unit vs template |

### Mission outcome

- `success`: reached objective AND `readiness > 20%`
- `partial`: reached objective AND `readiness <= 20%`
- `failed`: did not reach (reserved; normally progress completes)

### Readiness

Single squad percentage:

```
readiness = filledSlotsMatchingTemplate / totalTemplateSlots * 100
```

Counts personal slots + required consumables. Does not include morale/fatigue (future).

### Resupply (AtBase)

Each tick while `AtBase`:

1. For each unit slot in `LoadoutTemplate`, pull from `baseStorage` if missing
2. Trim excess consumables above template max
3. Emit log line `Resupplying…` on phase entry; UI shows countdown from `phaseTimeLeftMs`

`baseStorage` is finite — if stock empty, squad stays partially equipped (future logistics gameplay).

---

## 3. Data Model

### Squad (hardcoded)

**Name:** `KOBRA-1`

| Unit id | Role | Personal slots |
|---------|------|----------------|
| `medic` | Medic | `weapon`, `armor`, `medkit` |
| `engineer` | Engineer | `weapon`, `armor`, `toolkit` |
| `scout` | Scout | `weapon`, `armor`, `scanner` |

### LoadoutTemplate

Static map: `slotId → { itemId, qty }`. Not editable in MVP. Assigned per role defaults.

### BaseStorage

Initial constants, e.g. `ammo`, `medkit`, `fuel`, `materials` with starting quantities.

### GameState (serializable)

```ts
interface GameState {
  tick: number
  seed: number
  phase: GamePhase
  phaseTimeLeftMs: number
  missionProgress: number // 0..1
  objective: { x: number; y: number }
  squad: SquadState
  baseStorage: ItemStack[]
  eventLog: GameEvent[]      // max 20, FIFO
  lastReport: MissionReport | null
  mapNodes: MapNode[]        // static graph for UI
}

interface SquadState {
  name: string
  readiness: number
  units: UnitState[]
  cargo: ItemStack[]
}

interface MissionReport {
  outcome: 'success' | 'partial' | 'failed'
  durationMs: number
  readinessBefore: number
  readinessAfter: number
  events: GameEvent[]
  lootGained: ItemStack[]
  itemsLost: string[]
}
```

### Extension points (do not implement in MVP)

- `PlayerCommand`: `SetDoctrine`, `SendToObjective`, `ToggleAutoResupply`
- `doctrineId` on squad → selects template
- `morale`, `fatigue`, `weight`
- Multiple squads in `squads[]`

---

## 4. UI (React)

Target: **NINE LIVES CORP — Operational Command System** mockup shell.

### Layout

```
┌─ Header: title, resources, DAY/time, transport controls (visual only) ─┐
├─ Left ─────────┬─ Center MAP ────────────────────────┬─ Right ────────┤
│ Objectives     │ Tabs: MAP active; INTEL/FACTIONS disabled            │
│ Squads         │ Canvas: nodes, edges, squad position                  │
│ Base status    ├─ Squad Members: 3× UnitCard ─────────────────────────┤
│ (read-only)    │                                                       │
└────────────────┴───────────────────────────────────────────────────────┘
```

### MVP vs mockup

| UI area | MVP behavior |
|---------|----------------|
| Header resources | Derived from `baseStorage` (subset) |
| Objectives | Single card: auto patrol / current objective name |
| Squads list | Only KOBRA-1; status from `phase` |
| Map | 4–5 nodes; dashed edges; squad marker by `missionProgress` |
| Squad members row | 3 cards with placeholder portrait, role, slot icons, readiness bar |
| Right panel | Overview stats; large readiness % |
| SEND TO OBJECTIVE | Disabled, label `AUTO` |
| Auto resupply toggle | On, disabled |
| Template dropdown | Static `ASSAULT` |
| LOADOUT / VEHICLE tabs | Shown, disabled |
| Event log | Live `eventLog` with timestamps |
| Morale / fatigue / weight | Hidden |

### Design tokens

```css
--bg: #0b0f12;
--panel: #121820;
--border: #1e2a36;
--accent: #4ecdc4;
--warn: #f0a500;
--danger: #e74c3c;
--text: #c8d4dc;
--muted: #6b7d8a;
```

Typography: Inter or Rajdhani; section headers uppercase with letter-spacing.

### React components

- `AppShell`, `HeaderBar`, `ResourceStrip`
- `LeftSidebar` → `ObjectivesList`, `SquadList`, `BaseStatusCard`
- `MissionMap` (canvas ref, draws from state)
- `SquadMemberRow` → `UnitCard` ×3
- `RightSidebar` → `SquadDetailPanel`, `EventLogPanel`
- `PhaseBanner` (overlay: RESUPPLYING / ON MISSION / RETURNING)
- `MissionReportModal` (visible during `MissionReport` phase)

### Map rendering (Canvas)

- Static `mapNodes` from initial state
- HQ at fixed position; objective from `objective`
- Squad position: `lerp(hq, objective, missionProgress)`; when `Returning`, invert progress
- Node highlight on current objective

---

## 5. Testing

### `@paws/core` (vitest)

1. `AtBase` → after `BASE_PAUSE_MS` → transitions to `Deploying`
2. Resupply refills `medkit` after `encounter` reduced readiness
3. Same `seed` + tick sequence → identical `eventLog` hashes
4. `breakdown` reduces item count and readiness

### `@paws/ui`

- Optional: render `App` without throw (jsdom smoke)

---

## 6. Success Criteria

- [x] `pnpm install && pnpm dev` opens UI
- [x] Squad cycles missions without clicks
- [x] Map shows movement; event log updates
- [x] Mission report appears after each mission
- [x] Resupply phase visible (~15s) with readiness recovery when stock allows
- [x] Core tests pass with zero browser APIs
- [x] No imports from UI into core

---

## 7. Future Layers (ordered)

1. `PlayerCommand` + SEND TO OBJECTIVE
2. Doctrine templates (ASSAULT / RECON / SALVAGE)
3. `localStorage` persistence
4. Multi-squad + objectives queue
5. Rust port of `@paws/core` → WASM, UI swaps import
