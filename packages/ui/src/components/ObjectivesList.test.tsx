import { cleanup, render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import type { GameState } from '@paws/core'
import { ObjectivesList } from './ObjectivesList'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 0,
    seed: 42,
    simTimeMs: 0,
    missionIndex: 0,
    squads: [
      {
        id: 'KOBRA-1',
        name: 'KOBRA-1',
        readiness: 100,
        doctrine: 'ASSAULT',
        units: [],
        cargo: [],
        phase: 'InMission',
        phaseTimeLeftMs: 30000,
        missionProgress: 0.5,
        missionTargetId: 'target-0',
        missionTargetLabel: 'OLD MINES',
        missionTargetX: 280,
        missionTargetY: 120,
        missionTargetDurationMs: 45000,
        missionElapsedMs: 22500,
        nextEventInMs: 5000,
        missionEvents: [],
        readinessAtMissionStart: 100,
      },
      {
        id: 'KOBRA-2',
        name: 'KOBRA-2',
        readiness: 80,
        doctrine: 'RECON',
        units: [],
        cargo: [],
        phase: 'AtBase',
        phaseTimeLeftMs: 10000,
        missionProgress: 0,
        missionTargetId: null,
        missionTargetLabel: null,
        missionTargetX: 0,
        missionTargetY: 0,
        missionTargetDurationMs: 0,
        missionElapsedMs: 0,
        nextEventInMs: 10000,
        missionEvents: [],
        readinessAtMissionStart: 100,
      },
    ],
    baseStorage: [],
    eventLog: [],
    lastReport: null,
    mapNodes: [],
    missionPool: [
      {
        id: 'target-0',
        nodeId: 'mines',
        label: 'OLD MINES',
        type: 'ASSAULT',
        x: 280,
        y: 120,
        durationMs: 45000,
      },
      {
        id: 'target-1',
        nodeId: 'bay7',
        label: 'BAY-7 STATION',
        type: 'RECON',
        x: 520,
        y: 200,
        durationMs: 45000,
      },
      {
        id: 'target-2',
        nodeId: 'reactor',
        label: 'REACTOR SITE',
        type: 'SALVAGE',
        x: 680,
        y: 320,
        durationMs: 45000,
      },
    ],
    ...overrides,
  }
}

afterEach(() => cleanup())

describe('ObjectivesList', () => {
  it('shows all mission pool targets, including unassigned', () => {
    render(<ObjectivesList state={makeState()} />)

    // target-0 is assigned to KOBRA-1 (active)
    expect(screen.getByText(/OLD MINES/)).toBeDefined()
    // target-1 and target-2 are NOT assigned to any active squad
    expect(screen.getByText(/BAY-7 STATION/)).toBeDefined()
    expect(screen.getByText(/REACTOR SITE/)).toBeDefined()
  })

  it('shows all missions when no squad is active', () => {
    const state = makeState({
      squads: [
        {
          id: 'KOBRA-1',
          name: 'KOBRA-1',
          readiness: 100,
          doctrine: 'ASSAULT',
          units: [],
          cargo: [],
          phase: 'AtBase',
          phaseTimeLeftMs: 10000,
          missionProgress: 0,
          missionTargetId: null,
          missionTargetLabel: null,
          missionTargetX: 0,
          missionTargetY: 0,
          missionTargetDurationMs: 0,
          missionElapsedMs: 0,
          nextEventInMs: 10000,
          missionEvents: [],
          readinessAtMissionStart: 100,
        },
      ],
      missionPool: [
        {
          id: 'target-0',
          nodeId: 'mines',
          label: 'OLD MINES',
          type: 'ASSAULT',
          x: 280,
          y: 120,
          durationMs: 45000,
        },
        {
          id: 'target-1',
          nodeId: 'reactor',
          label: 'REACTOR SITE',
          type: 'SALVAGE',
          x: 680,
          y: 320,
          durationMs: 45000,
        },
      ],
    })
    render(<ObjectivesList state={state} />)

    expect(screen.getByText(/OLD MINES/)).toBeDefined()
    expect(screen.getByText(/REACTOR SITE/)).toBeDefined()
  })

  it('marks assigned missions with squad id', () => {
    render(<ObjectivesList state={makeState()} />)
    // Assigned target should show squad id
    expect(screen.getByText(/KOBRA-1/)).toBeDefined()
  })
})
