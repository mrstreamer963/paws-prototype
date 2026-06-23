import { describe, it, expect } from 'vitest'
import { createGame } from './game.js'
import { objectiveLabel } from './content.js'
import { BASE_PAUSE_MS, DEPLOYING_MS, MISSION_REPORT_MS, RETURNING_MS, TICK_STEP_MS } from './config.js'

describe('createGame', () => {
  it('all squads start AtBase with full resupply timer', () => {
    const game = createGame({ seed: 1 })
    const state = game.getState()
    expect(state.squads).toHaveLength(3)
    for (const squad of state.squads) {
      expect(squad.phase).toBe('AtBase')
      expect(squad.phaseTimeLeftMs).toBe(BASE_PAUSE_MS)
    }
  })

  it('logs all squads standing by at start', () => {
    const game = createGame({ seed: 1 })
    const state = game.getState()
    expect(state.eventLog[0].message).toBe('KOBRA-1, KOBRA-2, KOBRA-3 standing by')
  })

  it('squads stay AtBase until resupply timer expires', () => {
    const game = createGame({ seed: 1 })
    game.tick(TICK_STEP_MS)
    const state = game.getState()
    for (const squad of state.squads) {
      expect(squad.phase).toBe('AtBase')
    }
  })

  it('starts with 3 squads at AtBase', () => {
    const game = createGame({ seed: 1 })
    const state = game.getState()
    expect(state.squads).toHaveLength(3)
    expect(state.squads[0].phase).toBe('AtBase')
    expect(state.squads[1].phase).toBe('AtBase')
    expect(state.squads[2].phase).toBe('AtBase')
    expect(state.squads[0].id).toBe('KOBRA-1')
    expect(state.squads[1].id).toBe('KOBRA-2')
    expect(state.squads[2].id).toBe('KOBRA-3')
    expect(state.squads[2].doctrine).toBe('SALVAGE')
    expect(state.squads[0].doctrine).toBe('ASSAULT')
    expect(state.squads[1].doctrine).toBe('RECON')
    expect(state.missionPool.length).toBeGreaterThan(0)
  })

  it('transitions squad to Deploying after BASE_PAUSE_MS', () => {
    const game = createGame({ seed: 1 })
    const ticks = Math.ceil(BASE_PAUSE_MS / TICK_STEP_MS) + 2
    for (let i = 0; i < ticks; i++) game.tick(TICK_STEP_MS)
    const state = game.getState()
    // Both squads should have transitioned
    const deploying = state.squads.filter((s) => s.phase === 'Deploying' || s.phase === 'InMission')
    expect(deploying.length).toBeGreaterThan(0)
  })

  it('same seed produces identical event messages for N ticks', () => {
    const run = (seed: number) => {
      const g = createGame({ seed })
      for (let i = 0; i < 500; i++) g.tick(100)
      return g.getState().eventLog.map((e) => e.message).join('|')
    }
    expect(run(99)).toBe(run(99))
    expect(run(99)).not.toBe(run(100))
  })

  it('3 squads have independent phase cycles', () => {
    const game = createGame({ seed: 42 })
    const ticks = Math.ceil(BASE_PAUSE_MS / TICK_STEP_MS) + 1
    for (let i = 0; i < ticks; i++) game.tick(TICK_STEP_MS)
    const state = game.getState()
    expect(state.squads).toHaveLength(3)
    for (const squad of state.squads) {
      expect(squad.phase).not.toBe('AtBase')
    }
    const ids = state.squads.map((s) => s.id)
    expect(ids).toContain('KOBRA-1')
    expect(ids).toContain('KOBRA-2')
    expect(ids).toContain('KOBRA-3')
  })

  it('event log has squadId prefixes', () => {
    const game = createGame({ seed: 1 })
    const ticks = Math.ceil(BASE_PAUSE_MS / TICK_STEP_MS) + 50
    for (let i = 0; i < ticks; i++) game.tick(TICK_STEP_MS)
    const state = game.getState()
    const nonPhaseEvents = state.eventLog.filter((e) => e.type !== 'phase')
    for (const evt of nonPhaseEvents) {
      expect(evt.squadId).toMatch(/^KOBRA-\d$/)
    }
  })

  it('mission pool starts with 4 unique targets on non-hq nodes', () => {
    const game = createGame({ seed: 7 })
    const state = game.getState()
    expect(state.missionPool).toHaveLength(4)
    const nodeIds = state.missionPool.map((t) => t.nodeId)
    // Each target on a different node (no duplicates)
    expect(new Set(nodeIds).size).toBe(4)
    // No hq in mission pool
    expect(nodeIds).not.toContain('hq')
    for (const target of state.missionPool) {
      expect(['ASSAULT', 'RECON', 'PATROL', 'SALVAGE']).toContain(target.type)
    }
  })

  it('lastReport is cleared after MissionReport → AtBase', () => {
    const game = createGame({ seed: 1 })
    // Fast-forward to let a squad complete InMission, enter MissionReport
    // Full cycle: AtBase(15s) + Deploying(2s) + InMission(max 60s) + Returning(5s) + MissionReport(5s) = ~87s
    const totalTicks = Math.ceil(90000 / TICK_STEP_MS) + 5
    for (let i = 0; i < totalTicks; i++) game.tick(TICK_STEP_MS)
    const state = game.getState()
    // At least one squad should be back at AtBase
    const atBase = state.squads.find((s) => s.phase === 'AtBase')
    expect(atBase).toBeDefined()
    // lastReport must be null after debrief is done
    expect(state.lastReport).toBeNull()
  })

  it('squads progress through InMission phase', () => {
    const game = createGame({ seed: 1 })
    // Run enough for at least one full cycle
    const ticks = 2000 // 200 seconds, enough for multiple missions
    for (let i = 0; i < ticks; i++) game.tick(TICK_STEP_MS)
    const state = game.getState()
    const inMission = state.squads.filter((s) => s.phase === 'InMission')
    // At least one should be in mission or completed one
    expect(state.missionIndex).toBeGreaterThan(0)
  })

  it('squad stores correct missionTargetLabel after deployment', () => {
    const game = createGame({ seed: 42 })
    // Fast-forward past AtBase + Deploying to InMission
    const deployTicks = Math.ceil((BASE_PAUSE_MS + DEPLOYING_MS) / TICK_STEP_MS) + 2
    for (let i = 0; i < deployTicks; i++) game.tick(TICK_STEP_MS)
    const state = game.getState()
    const inMission = state.squads.find((s) => s.phase === 'InMission' || s.phase === 'Deploying')
    expect(inMission).toBeDefined()
    console.log('inMission:', inMission!.id, 'phase:', inMission!.phase, 'label:', inMission!.missionTargetLabel, 'x:', inMission!.missionTargetX, 'y:', inMission!.missionTargetY)
    // missionTargetLabel must be set and NOT the fallback
    expect(inMission!.missionTargetLabel).not.toBeNull()
    expect(inMission!.missionTargetLabel).not.toBe('OLD MINES')
    // Should match an actual map node label
    const labels = state.mapNodes.map((n) => n.label)
    expect(labels).toContain(inMission!.missionTargetLabel)
  })

  it('rolls mission events using target type not squad doctrine', () => {
    // KOBRA-1 is ASSAULT doctrine; when it takes a PATROL target (fallback),
    // event weights must follow PATROL (no encounters), not ASSAULT.
    let patrolSeed: number | null = null
    for (let seed = 0; seed < 5000; seed++) {
      const game = createGame({ seed })
      const deployTicks = Math.ceil((BASE_PAUSE_MS + DEPLOYING_MS) / TICK_STEP_MS) + 2
      for (let i = 0; i < deployTicks; i++) game.tick(TICK_STEP_MS)
      const kobra1 = game.getState().squads[0]
      if (
        kobra1.doctrine === 'ASSAULT' &&
        kobra1.missionTargetDurationMs === 30000 &&
        kobra1.phase === 'InMission'
      ) {
        patrolSeed = seed
        break
      }
    }
    expect(patrolSeed).not.toBeNull()

    const game = createGame({ seed: patrolSeed! })
    const deployTicks = Math.ceil((BASE_PAUSE_MS + DEPLOYING_MS) / TICK_STEP_MS) + 2
    for (let i = 0; i < deployTicks; i++) game.tick(TICK_STEP_MS)
    expect(game.getState().squads[0].missionTargetType).toBe('PATROL')

    const missionTicks = Math.ceil(30000 / TICK_STEP_MS)
    for (let i = 0; i < missionTicks; i++) game.tick(TICK_STEP_MS)

    const missionEvents = game
      .getState()
      .eventLog.filter(
        (e) =>
          e.squadId === 'KOBRA-1' &&
          e.type !== 'phase' &&
          e.type !== 'resupply',
      )
    expect(missionEvents.some((e) => e.type === 'encounter')).toBe(false)
  })

  it('squad missionTargetLabel is cleared when returning to base', () => {
    const game = createGame({ seed: 1 })
    const totalTicks = Math.ceil(90000 / TICK_STEP_MS) + 5
    for (let i = 0; i < totalTicks; i++) game.tick(TICK_STEP_MS)
    const state = game.getState()
    const atBase = state.squads.find((s) => s.phase === 'AtBase')
    if (atBase) {
      expect(atBase.missionTargetId).toBeNull()
      expect(atBase.missionTargetLabel).toBeNull()
    }
  })
})
