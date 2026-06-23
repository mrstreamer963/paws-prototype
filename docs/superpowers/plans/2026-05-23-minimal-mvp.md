# Minimal MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browser idle loop — KOBRA-1 auto-missions, events, resupply, React UI shell per NINE LIVES CORP mockup.

**Architecture:** pnpm monorepo; `@paws/core` pure tick sim (WASM-ready); `@paws/ui` React + Canvas map.

**Tech Stack:** TypeScript, pnpm workspaces, vitest, Vite, React 19.

**Spec:** `docs/superpowers/specs/2026-05-23-minimal-mvp-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `pnpm-workspace.yaml` | workspace roots |
| `package.json` | root scripts: `dev`, `test`, `build` |
| `packages/core/package.json` | `@paws/core` package |
| `packages/core/src/types.ts` | all serializable types |
| `packages/core/src/config.ts` | phase durations, tick step |
| `packages/core/src/content.ts` | templates, storage, map nodes, unit defs |
| `packages/core/src/rng.ts` | seeded PRNG |
| `packages/core/src/readiness.ts` | readiness % |
| `packages/core/src/resupply.ts` | AtBase resupply |
| `packages/core/src/events.ts` | encounter/loot/breakdown |
| `packages/core/src/game.ts` | `createGame`, phase FSM, `tick` |
| `packages/core/src/index.ts` | public exports |
| `packages/core/src/game.test.ts` | vitest suite |
| `packages/ui/vite.config.ts` | alias `@paws/core` |
| `packages/ui/src/hooks/useGameLoop.ts` | rAF loop |
| `packages/ui/src/components/*` | layout shell |
| `packages/ui/src/canvas/drawMap.ts` | canvas rendering |
| `packages/ui/src/styles/tokens.css` | design tokens |

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/index.ts`

- [ ] **Step 1: Create workspace files**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
```

Root `package.json`:
```json
{
  "name": "paws-prototype",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @paws/ui dev",
    "test": "pnpm -r test",
    "build": "pnpm -r build"
  }
}
```

`packages/core/package.json`:
```json
{
  "name": "@paws/core",
  "version": "0.0.1",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

`packages/core/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/core/src/index.ts`:
```ts
export type { GameState, GamePhase, PlayerCommand } from './types.js'
export { createGame } from './game.js'
export type { Game } from './game.js'
```

- [ ] **Step 2: Install and verify**

Run: `cd /Users/random/restore/paws-prototype && pnpm install`
Expected: lockfile created, no errors

- [ ] **Step 3: Commit**

```bash
git add pnpm-workspace.yaml package.json packages/core
git commit -m "chore: scaffold pnpm monorepo with @paws/core package"
```

---

### Task 2: Core types and config

**Files:**
- Create: `packages/core/src/types.ts`, `packages/core/src/config.ts`, `packages/core/vitest.config.ts`

- [ ] **Step 1: Write types**

`packages/core/src/types.ts`:
```ts
export type GamePhase =
  | 'AtBase'
  | 'Deploying'
  | 'InMission'
  | 'Returning'
  | 'MissionReport'

export type PlayerCommand = never

export interface ItemStack {
  itemId: string
  qty: number
}

export interface UnitSlot {
  slotId: string
  itemId: string | null
}

export interface UnitState {
  id: string
  name: string
  role: string
  slots: UnitSlot[]
}

export interface SquadState {
  name: string
  readiness: number
  units: UnitState[]
  cargo: ItemStack[]
}

export interface MapNode {
  id: string
  label: string
  x: number
  y: number
}

export interface GameEvent {
  tick: number
  simTimeMs: number
  type: 'encounter' | 'loot' | 'breakdown' | 'phase' | 'resupply'
  message: string
}

export interface MissionReport {
  outcome: 'success' | 'partial' | 'failed'
  durationMs: number
  readinessBefore: number
  readinessAfter: number
  events: GameEvent[]
  lootGained: ItemStack[]
  itemsLost: string[]
}

export interface GameState {
  tick: number
  seed: number
  simTimeMs: number
  missionIndex: number
  phase: GamePhase
  phaseTimeLeftMs: number
  missionProgress: number
  objective: { x: number; y: number }
  squad: SquadState
  baseStorage: ItemStack[]
  eventLog: GameEvent[]
  lastReport: MissionReport | null
  mapNodes: MapNode[]
}
```

`packages/core/src/config.ts`:
```ts
export const TICK_STEP_MS = 100
export const DEPLOYING_MS = 2000
export const MISSION_DURATION_MS = 45000
export const RETURNING_MS = 5000
export const MISSION_REPORT_MS = 5000
export const BASE_PAUSE_MS = 15000
export const EVENT_INTERVAL_MS = 8000
export const EVENT_LOG_MAX = 20
export const MAP_WIDTH = 800
export const MAP_HEIGHT = 500
```

`packages/core/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node' } })
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/config.ts packages/core/vitest.config.ts
git commit -m "feat(core): add GameState types and timing config"
```

---

### Task 3: Content, RNG, readiness

**Files:**
- Create: `packages/core/src/content.ts`, `packages/core/src/rng.ts`, `packages/core/src/readiness.ts`, `packages/core/src/readiness.test.ts`

- [ ] **Step 1: Write failing readiness test**

`packages/core/src/readiness.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computeReadiness } from './readiness.js'
import { createInitialSquad } from './content.js'

describe('computeReadiness', () => {
  it('returns 100 when all template slots filled', () => {
    const squad = createInitialSquad()
    expect(computeReadiness(squad)).toBe(100)
  })

  it('drops when a consumable slot is empty', () => {
    const squad = createInitialSquad()
    squad.units[0].slots.find((s) => s.slotId === 'medkit')!.itemId = null
    expect(computeReadiness(squad)).toBeLessThan(100)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd packages/core && pnpm test`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement content, rng, readiness**

`packages/core/src/rng.ts`:
```ts
export function createRng(seed: number) {
  let s = seed >>> 0
  return {
    next(): number {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 0x100000000
    },
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min
    },
  }
}
```

`packages/core/src/content.ts` — implement:
- `MAP_NODES` (5 nodes: HQ + 4 POIs with labels)
- `UNIT_TEMPLATES` per role: weapon/armor/consumable itemIds
- `createInitialSquad()` → KOBRA-1, 3 units (medic/engineer/scout) with filled slots
- `createInitialStorage()` → `[{itemId:'ammo',qty:200},{itemId:'medkit',qty:10},...]`
- `getTemplateSlotsForUnit(unitId)` → slot list for resupply

`packages/core/src/readiness.ts`:
```ts
import type { SquadState } from './types.js'
import { getTemplateSlotsForUnit } from './content.js'

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
  return Math.round((filled / total) * 100)
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `cd packages/core && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/content.ts packages/core/src/rng.ts packages/core/src/readiness.ts packages/core/src/readiness.test.ts
git commit -m "feat(core): add content fixtures, RNG, and readiness calculation"
```

---

### Task 4: Resupply system

**Files:**
- Create: `packages/core/src/resupply.ts`, `packages/core/src/resupply.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest'
import { resupplySquad } from './resupply.js'
import { createInitialSquad, createInitialStorage } from './content.js'

describe('resupplySquad', () => {
  it('refills medkit from base storage', () => {
    const squad = createInitialSquad()
    const medic = squad.units.find((u) => u.id === 'medic')!
    medic.slots.find((s) => s.slotId === 'medkit')!.itemId = null
    const storage = createInitialStorage()
    resupplySquad(squad, storage)
    expect(medic.slots.find((s) => s.slotId === 'medkit')!.itemId).toBe('medkit')
    const medStack = storage.find((s) => s.itemId === 'medkit')
    expect(medStack!.qty).toBeLessThan(10)
  })
})
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `resupply.ts`**

Logic:
- For each unit, for each template slot: if empty and storage has qty, assign and decrement storage
- Mutates `squad` and `baseStorage` in place

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(core): add base resupply toward loadout template"
```

---

### Task 5: Event handlers

**Files:**
- Create: `packages/core/src/events.ts`, `packages/core/src/events.test.ts`

- [ ] **Step 1: Write failing breakdown test**

```ts
import { describe, it, expect } from 'vitest'
import { applyBreakdown } from './events.js'
import { createInitialSquad } from './content.js'
import { computeReadiness } from './readiness.js'
import { createRng } from './rng.js'

describe('applyBreakdown', () => {
  it('clears a consumable slot and lowers readiness', () => {
    const squad = createInitialSquad()
    const before = computeReadiness(squad)
    const evt = applyBreakdown(squad, createRng(42), 0, 0)
    expect(evt.type).toBe('breakdown')
    expect(computeReadiness(squad)).toBeLessThan(before)
  })
})
```

- [ ] **Step 2–4: Implement `events.ts`**

```ts
export function applyEncounter(squad, readinessPenalty = 15): GameEvent
export function applyLoot(squad, rng, tick, simTimeMs): GameEvent  // adds scrap to cargo
export function applyBreakdown(squad, rng, tick, simTimeMs): GameEvent  // random unit consumable → null
```

`applyEncounter`: pick random unit, clear one non-weapon slot OR reduce readiness via slot clear — implement as clearing `armor` slot if present else random consumable; push narrative message.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(core): add mission event handlers"
```

---

### Task 6: Game FSM and public API

**Files:**
- Create: `packages/core/src/game.ts`, `packages/core/src/game.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing phase transition test**

```ts
import { describe, it, expect } from 'vitest'
import { createGame } from './game.js'
import { BASE_PAUSE_MS, TICK_STEP_MS } from './config.js'

describe('createGame', () => {
  it('transitions AtBase to Deploying after BASE_PAUSE_MS', () => {
    const game = createGame({ seed: 1 })
    let state = game.getState()
    expect(state.phase).toBe('AtBase')
    const ticks = Math.ceil(BASE_PAUSE_MS / TICK_STEP_MS) + 1
    for (let i = 0; i < ticks; i++) game.tick(TICK_STEP_MS)
    state = game.getState()
    expect(state.phase).toBe('Deploying')
  })
})
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `game.ts`**

Key implementation notes:
- `createGame({ seed })` builds initial `GameState`: phase `AtBase`, `phaseTimeLeftMs = BASE_PAUSE_MS`, squad from content, `mapNodes`, log entry `"KOBRA-1 standing by"`
- `tick(dtMs)`: accumulate into step buffer; while `>= TICK_STEP_MS`, call `step()`
- `step()`: decrement `phaseTimeLeftMs`; on zero call `advancePhase()`; update `missionProgress` in `InMission`/`Returning`; fire events every `EVENT_INTERVAL_MS` using mission elapsed time; on mission end build `MissionReport`
- `advancePhase()` chain: AtBase→Deploying→InMission→Returning→MissionReport→AtBase; on entering AtBase call `resupplySquad`; on entering InMission roll new `objective` with rng
- `pushEvent(state, evt)`: prepend to `eventLog`, cap at 20
- After each step: `squad.readiness = computeReadiness(squad)`
- Export interface `Game { tick(dtMs: number): void; getState(): GameState }`

- [ ] **Step 4: Write determinism test**

```ts
it('same seed produces identical event messages for N ticks', () => {
  const run = (seed: number) => {
    const g = createGame({ seed })
    for (let i = 0; i < 500; i++) g.tick(100)
    return g.getState().eventLog.map((e) => e.message).join('|')
  }
  expect(run(99)).toBe(run(99))
  expect(run(99)).not.toBe(run(100))
})
```

- [ ] **Step 5: Run all core tests — PASS**

Run: `cd packages/core && pnpm test`

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(core): implement idle mission phase machine and tick loop"
```

---

### Task 7: UI package scaffold

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/vite.config.ts`, `packages/ui/tsconfig.json`, `packages/ui/index.html`, `packages/ui/src/main.tsx`, `packages/ui/src/App.tsx`

- [ ] **Step 1: Create Vite React app**

`packages/ui/package.json` deps: `react`, `react-dom`, `@paws/core` workspace, dev: `vite`, `@vitejs/plugin-react`, `@types/react`, `typescript`, `vitest`, `jsdom`, `@testing-library/react`

`packages/ui/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@paws/core': path.resolve(__dirname, '../core/src/index.ts') },
  },
})
```

`packages/ui/src/main.tsx`: standard React 19 mount on `#root`

`packages/ui/src/App.tsx`:
```tsx
import { useGameLoop } from './hooks/useGameLoop'
import { AppShell } from './components/AppShell'

export default function App() {
  const state = useGameLoop()
  return <AppShell state={state} />
}
```

- [ ] **Step 2: Implement `useGameLoop.ts`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { createGame, type GameState } from '@paws/core'

export function useGameLoop(): GameState {
  const gameRef = useRef(createGame({ seed: 42 }))
  const [state, setState] = useState(() => gameRef.current.getState())
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = now - last
      last = now
      gameRef.current.tick(dt)
      setState(gameRef.current.getState())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return state
}
```

- [ ] **Step 3: Verify dev server**

Run: `pnpm install && pnpm dev`
Expected: Vite serves page (blank shell OK)

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ui): scaffold Vite React app wired to @paws/core"
```

---

### Task 8: Design tokens and AppShell layout

**Files:**
- Create: `packages/ui/src/styles/tokens.css`, `packages/ui/src/styles/layout.css`, `packages/ui/src/components/AppShell.tsx`, `packages/ui/src/components/HeaderBar.tsx`

- [ ] **Step 1: Add tokens per spec**

`tokens.css` — CSS variables from spec (`--bg`, `--panel`, `--accent`, …)

Import Inter from Google fonts in `index.html`

- [ ] **Step 2: AppShell grid**

3-column + header + bottom squad row matching mockup:
- `grid-template-areas`: header / left map right / squad-row
- Props: `state: GameState`
- Compose placeholder divs for sidebars

- [ ] **Step 3: HeaderBar**

Show: `NINE LIVES CORP`, resources from `baseStorage` (power=fuel, supplies=materials, ammo), `DAY {floor(simTimeMs/86400000)+1}`, clock from `simTimeMs`

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ui): add mockup layout shell and design tokens"
```

---

### Task 9: Left and right sidebars

**Files:**
- Create: `ObjectivesList.tsx`, `SquadList.tsx`, `BaseStatusCard.tsx`, `SquadDetailPanel.tsx`, `EventLogPanel.tsx`

- [ ] **Step 1: ObjectivesList**

Single card: title `AUTO PATROL`, location from nearest `mapNodes` label to `objective`, priority badge `MEDIUM`

- [ ] **Step 2: SquadList**

One row KOBRA-1: `phase` → human status (`Ready`/`On Mission`/`Returning`/`Resupplying`), readiness mini bar

- [ ] **Step 3: BaseStatusCard**

Static text: Security 72%, Workers 14, Operatives 3 — values hardcoded OK for MVP

- [ ] **Step 4: SquadDetailPanel**

Large readiness %, rows: Status, Location (from phase), disabled tabs LOADOUT/VEHICLE, `SEND TO OBJECTIVE` button disabled text `AUTO`, auto-resupply toggle checked+disabled, template `ASSAULT`

- [ ] **Step 5: EventLogPanel**

Map `state.eventLog` reverse chronological, format time from `simTimeMs`

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(ui): add sidebar panels wired to GameState"
```

---

### Task 10: Squad member cards

**Files:**
- Create: `SquadMemberRow.tsx`, `UnitCard.tsx`

- [ ] **Step 1: UnitCard**

Props: `unit: UnitState`, `readiness: number` (per-unit: filled slots / total for that unit)
- Placeholder portrait: colored div + role emoji (🩺🔧👁)
- Name from `unit.name` (CAPTAIN-style uppercase hardcoded in content)
- Role subtitle
- 3 slot icons from `unit.slots` (text abbrev: SMG, ARM, MED)
- Readiness bar color: green >80, yellow >60, orange below

- [ ] **Step 2: SquadMemberRow**

Horizontal flex of 3 UnitCards under map

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(ui): add squad member card row"
```

---

### Task 11: Canvas tactical map

**Files:**
- Create: `packages/ui/src/canvas/drawMap.ts`, `packages/ui/src/components/MissionMap.tsx`

- [ ] **Step 1: drawMap function**

```ts
export function drawMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
): void
```

Draw:
- Dark background `#0b0f12`
- Dashed edges between `mapNodes` (static edge list in file)
- Nodes as circles + labels
- HQ node always visible
- Objective node highlighted when `phase` is InMission/Returning
- Squad marker: teal triangle at `lerp(hq, objective, progress)` where progress = `missionProgress` or `1 - missionProgress` when Returning

- [ ] **Step 2: MissionMap component**

- `useRef<HTMLCanvasElement>` + `useEffect` on `state` resize observer
- Map tabs header: MAP active, INTEL/FACTIONS `disabled`

- [ ] **Step 3: Manual check**

Run `pnpm dev` — marker moves during mission phases

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ui): add canvas tactical map with squad marker"
```

---

### Task 12: Phase banner and mission report modal

**Files:**
- Create: `PhaseBanner.tsx`, `MissionReportModal.tsx`

- [ ] **Step 1: PhaseBanner**

Overlay top of map:
- `AtBase` → `RESUPPLYING… {ceil(phaseTimeLeftMs/1000)}s`
- `InMission` → `ON MISSION`
- `Returning` → `RETURNING TO HQ`
- `Deploying` → `DEPLOYING`

- [ ] **Step 2: MissionReportModal**

When `phase === 'MissionReport'` and `lastReport`, show modal:
- Outcome headline (SUCCESS / PARTIAL)
- readiness before→after
- bullet list of mission events
- loot gained / items lost

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(ui): add phase banner and mission report modal"
```

---

### Task 13: Error boundary and smoke test

**Files:**
- Create: `packages/ui/src/ErrorBoundary.tsx`, `packages/ui/src/App.test.tsx`

- [ ] **Step 1: ErrorBoundary wrap in main.tsx**

- [ ] **Step 2: Smoke test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders NINE LIVES CORP header', () => {
    render(<App />)
    expect(screen.getByText(/NINE LIVES CORP/i)).toBeDefined()
  })
})
```

- [ ] **Step 3: Run `pnpm test` at root — all pass**

- [ ] **Step 4: Commit**

```bash
git commit -m "test(ui): add ErrorBoundary and App smoke test"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```
Expected: all packages green

- [ ] **Step 2: Manual idle loop check**

```bash
pnpm dev
```

Verify:
- [ ] Squad cycles without clicks
- [ ] Event log grows during mission
- [ ] Report modal ~5s after mission
- [ ] Resupply banner ~15s at base
- [ ] Readiness recovers when storage has stock

- [ ] **Step 3: Commit any fixes**

```bash
git commit -m "fix: address MVP verification issues"  # if needed
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Monorepo core/ui | 1, 7 |
| WASM-ready core API | 2, 6 |
| Phase FSM | 6 |
| Events encounter/loot/breakdown | 5, 6 |
| Readiness % | 3, 6 |
| Resupply AtBase | 4, 6 |
| KOBRA-1 3 cats | 3 |
| React mockup shell | 8–12 |
| Canvas map | 11 |
| Core vitest tests | 3–6 |
| No persistence | — (omitted by design) |
| PlayerCommand = never | 2 |

---

## Execution handoff

Plan saved. Options:

1. **Subagent-Driven** — fresh subagent per task, review between tasks  
2. **Inline** — execute in this session with checkpoints

Which?
