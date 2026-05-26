import {
  BASE_PAUSE_MS,
  DEPLOYING_MS,
  EVENT_INTERVAL_MS,
  EVENT_LOG_MAX,
  MISSION_REPORT_MS,
  READINESS_EXTEND_RESUPPLY,
  RETURNING_MS,
  TICK_STEP_MS,
} from './config.js'
import {
  MAP_NODES,
  createInitialSquads,
  createInitialStorage,
  createInitialMissionPool,
  selectTargetForSquad,
  removeTargetFromPool,
  regenerateMissionPool,
  getHqPosition,
} from './content.js'
import { itemsLostDuringMission, rollMissionEvent } from './events.js'
import { createRng, type Rng } from './rng.js'
import { computeReadiness } from './readiness.js'
import { resupplySquad } from './resupply.js'
import type {
  GameEvent,
  GameState,
  SquadState,
  MissionReport,
  SquadId,
  ItemStack,
} from './types.js'

const PHASE_MESSAGES: Record<SquadId & string, Record<string, string>> = {
  'KOBRA-1': {
    AtBase: 'KOBRA-1 at HQ — resupply',
    Deploying: 'KOBRA-1 deploying',
    InMission: 'KOBRA-1 on mission',
    Returning: 'KOBRA-1 returning to HQ',
    MissionReport: 'KOBRA-1 mission debrief',
  },
  'KOBRA-2': {
    AtBase: 'KOBRA-2 at HQ — resupply',
    Deploying: 'KOBRA-2 deploying',
    InMission: 'KOBRA-2 on mission',
    Returning: 'KOBRA-2 returning to HQ',
    MissionReport: 'KOBRA-2 mission debrief',
  },
  'KOBRA-3': {
    AtBase: 'KOBRA-3 at HQ — resupply',
    Deploying: 'KOBRA-3 deploying',
    InMission: 'KOBRA-3 on mission',
    Returning: 'KOBRA-3 returning to HQ',
    MissionReport: 'KOBRA-3 mission debrief',
  },
}

function pushEvent(state: GameState, event: GameEvent): void {
  state.eventLog = [event, ...state.eventLog].slice(0, EVENT_LOG_MAX)
}

function cloneSquad(squad: SquadState): SquadState {
  return JSON.parse(JSON.stringify(squad)) as SquadState
}

function lootGainedSince(current: SquadState, before: SquadState): ItemStack[] {
  const gained: ItemStack[] = []
  for (const stack of current.cargo) {
    const prev = before.cargo.find((s) => s.itemId === stack.itemId)?.qty ?? 0
    const delta = stack.qty - prev
    if (delta > 0) gained.push({ itemId: stack.itemId, qty: delta })
  }
  return gained
}

function buildReport(
  squad: SquadState,
  before: SquadState,
  startSimTime: number,
  missionEvents: GameEvent[],
): MissionReport {
  const readinessAfter = computeReadiness(squad)
  const outcome: MissionReport['outcome'] =
    readinessAfter > 20 ? 'success' : 'partial'
  // Extract body scavenging loot from mission events
  const bodyLoot: MissionReport['bodyLoot'] = missionEvents
    .filter((e) => e.message.includes('scavenged body'))
    .map((e) => {
      const match = e.message.match(/\+(\d+) (.+)/)
      if (match) {
        return { itemId: match[2], qty: parseInt(match[1]) }
      }
      return null
    })
    .filter(Boolean) as MissionReport['bodyLoot']

  return {
    outcome,
    durationMs: squad.missionElapsedMs,
    readinessBefore: squad.readinessAtMissionStart,
    readinessAfter,
    events: [...missionEvents],
    lootGained: lootGainedSince(squad, before),
    itemsLost: itemsLostDuringMission(squad, before),
    bodyLoot,
  }
}

function enterPhase(
  state: GameState,
  squad: SquadState,
  phase: SquadState['phase'],
  durationMs: number,
  rng: Rng,
): void {
  squad.phase = phase
  squad.phaseTimeLeftMs = durationMs
  const messages = PHASE_MESSAGES[squad.id as keyof typeof PHASE_MESSAGES] || {}
  pushEvent(state, {
    tick: state.tick,
    simTimeMs: state.simTimeMs,
    squadId: squad.id,
    type: 'phase',
    message: messages[phase] ?? 'Phase change',
  })

  if (phase === 'AtBase') {
    resupplySquad(squad, state.baseStorage)
    pushEvent(state, {
      tick: state.tick,
      simTimeMs: state.simTimeMs,
      squadId: squad.id,
      type: 'resupply',
      message: `Resupplying KOBRA-${squad.id.slice(-1)}…`,
    })
    squad.missionProgress = 0
    squad.missionTargetId = null
    squad.missionElapsedMs = 0
    squad.nextEventInMs = EVENT_INTERVAL_MS
    squad.missionEvents = []
    state.lastReport = null

    // Extend resupply if readiness low
    const finalReadiness = computeReadiness(squad)
    if (finalReadiness < 80) {
      squad.phaseTimeLeftMs += READINESS_EXTEND_RESUPPLY
    }
  }

  if (phase === 'Deploying') {
    squad.missionProgress = 0
  }

  if (phase === 'InMission') {
    state.missionIndex += 1
    squad.missionProgress = 0
    squad.missionElapsedMs = 0
    squad.nextEventInMs = EVENT_INTERVAL_MS
    squad.missionEvents = []
    squad.readinessAtMissionStart = computeReadiness(squad)
    // Store before snapshot for report
    ;(squad as SquadState & { _before: SquadState })._before = cloneSquad(squad)
  }

  if (phase === 'Returning') {
    squad.missionProgress = 1
  }

  if (phase === 'MissionReport') {
    const before = (squad as SquadState & { _before?: SquadState })._before ?? cloneSquad(squad)
    state.lastReport = buildReport(
      squad,
      before,
      state.simTimeMs - squad.missionElapsedMs,
      squad.missionEvents,
    )
  }

  squad.readiness = computeReadiness(squad)
}

function advancePhase(
  state: GameState,
  squad: SquadState,
  rng: Rng,
): void {
  const phases: Array<SquadState['phase']> = [
    'AtBase',
    'Deploying',
    'InMission',
    'Returning',
    'MissionReport',
  ]
  const currentIdx = phases.indexOf(squad.phase)
  if (currentIdx < 0) return
  const nextPhase = phases[currentIdx + 1] ?? 'AtBase'

  switch (nextPhase) {
    case 'Deploying':
      enterPhase(state, squad, 'Deploying', DEPLOYING_MS, rng)
      break
    case 'InMission': {
      // Select target from pool
      const target = selectTargetForSquad(state.missionPool, squad.doctrine)
      if (target) {
        removeTargetFromPool(state.missionPool, target.id)
        squad.missionTargetId = target.id
        enterPhase(state, squad, 'InMission', target.durationMs, rng)
      } else {
        // Pool empty — regenerate
        regenerateMissionPool(state.missionPool, state.seed)
        const newTarget = selectTargetForSquad(state.missionPool, squad.doctrine)!
        removeTargetFromPool(state.missionPool, newTarget.id)
        squad.missionTargetId = newTarget.id
        enterPhase(state, squad, 'InMission', newTarget.durationMs, rng)
      }
      break
    }
    case 'Returning':
      enterPhase(state, squad, 'Returning', RETURNING_MS, rng)
      break
    case 'MissionReport':
      enterPhase(state, squad, 'MissionReport', MISSION_REPORT_MS, rng)
      break
    case 'AtBase':
      enterPhase(state, squad, 'AtBase', BASE_PAUSE_MS, rng)
      break
  }
}

function step(state: GameState, rng: Rng): void {
  state.tick += 1
  state.simTimeMs += TICK_STEP_MS

  for (const squad of state.squads) {
    squad.phaseTimeLeftMs -= TICK_STEP_MS

    if (squad.phase === 'InMission') {
      squad.missionElapsedMs += TICK_STEP_MS
      squad.missionProgress = Math.min(
        1,
        squad.missionElapsedMs / (squad.missionTargetId
          ? state.missionPool.find((t) => t.id === squad.missionTargetId)?.durationMs
          ?? 45000
          : 45000),
      )
      squad.nextEventInMs -= TICK_STEP_MS

      const targetDuration = state.missionPool.find(
        (t) => t.id === squad.missionTargetId,
      )?.durationMs ?? 45000
      const targetConfig = state.missionPool.find(
        (t) => t.id === squad.missionTargetId,
      )
      const config = targetConfig
        ? {
            eventRateModifier: 1,
            penaltyPercent: 10,
            lootMultiplier: 1,
          }
        : { eventRateModifier: 1, penaltyPercent: 10, lootMultiplier: 1 }
      squad.nextEventInMs -= Math.round(TICK_STEP_MS / config.eventRateModifier)

      if (squad.nextEventInMs <= 0) {
        const evt = rollMissionEvent(
          squad,
          rng,
          state.tick,
          state.simTimeMs,
          targetConfig?.type ?? 'RECON',
        )
        squad.missionEvents.push(evt)
        pushEvent(state, evt)
        squad.nextEventInMs = EVENT_INTERVAL_MS
      }

      squad.missionProgress = Math.min(
        1,
        squad.missionElapsedMs / targetDuration,
      )
    }

    if (squad.phase === 'Returning') {
      squad.missionProgress = Math.max(
        0,
        squad.phaseTimeLeftMs / RETURNING_MS,
      )
    }

    if (squad.phaseTimeLeftMs <= 0) {
      advancePhase(state, squad, rng)
    }
  }
}

export interface Game {
  tick(dtMs: number): void
  getState(): GameState
}

export function createGame(options?: { seed?: number }): Game {
  const seed = options?.seed ?? 42
  const rng: Rng = createRng(seed)
  const squads = createInitialSquads()
  const initialMissionPool = createInitialMissionPool(seed)

  const state: GameState = {
    tick: 0,
    seed,
    simTimeMs: 0,
    missionIndex: 0,
    squads,
    baseStorage: createInitialStorage(),
    eventLog: [],
    lastReport: null,
    mapNodes: MAP_NODES,
    missionPool: initialMissionPool,
  }

  // Mark KOBRA-1 as starting resupply first
  squads[0].phase = 'AtBase'
  squads[0].phaseTimeLeftMs = BASE_PAUSE_MS
  squads[1].phase = 'AtBase'
  squads[1].phaseTimeLeftMs = BASE_PAUSE_MS

  pushEvent(state, {
    tick: 0,
    simTimeMs: 0,
    squadId: 'KOBRA-1',
    type: 'phase',
    message: 'KOBRA-1 and KOBRA-2 standing by',
  })

  let accumulated = 0

  return {
    tick(dtMs: number): void {
      accumulated += dtMs
      while (accumulated >= TICK_STEP_MS) {
        accumulated -= TICK_STEP_MS
        step(state, rng)
      }
    },
    getState(): GameState {
      return structuredClone(state)
    },
  }
}
