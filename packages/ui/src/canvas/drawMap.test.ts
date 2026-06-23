import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { drawMap } from './drawMap'
import type { GameState } from '@paws/core'
import { MAP_NODES } from '@paws/core'

beforeEach(() => {
  vi.stubGlobal('window', { devicePixelRatio: 1 })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeMockCtx() {
  const arcCalls: Array<{ cx: number; cy: number; r: number }> = []
  const fillStyleValues: string[] = []

  const ctx = {
    setTransform: vi.fn(),
    fillStyle: '',
    fillRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    setLineDash: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn((cx: number, cy: number, r: number, s: number, e: number) => {
      arcCalls.push({ cx, cy, r })
    }),
    fill: vi.fn(() => {
      fillStyleValues.push(ctx.fillStyle)
    }),
    closePath: vi.fn(),
    fillText: vi.fn(),
    font: '',
    textAlign: '',
    arcCalls,
    fillStyleValues,
  } as unknown as CanvasRenderingContext2D

  return ctx
}

function makeSquadState(phase: string, missionTargetId: string | null = null, missionTargetX = 0, missionTargetY = 0) {
  return {
    id: 'KOBRA-1' as const,
    name: 'KOBRA-1',
    readiness: 100,
    doctrine: 'ASSAULT' as const,
    units: [],
    cargo: [],
    phase,
    phaseTimeLeftMs: 0,
    missionProgress: 0,
    missionTargetId,
    missionTargetLabel: null,
    missionTargetX,
    missionTargetY,
    missionTargetDurationMs: 30000,
    missionElapsedMs: 0,
    nextEventInMs: 0,
    missionEvents: [],
    readinessAtMissionStart: 100,
  }
}

function makeState(squads: ReturnType<typeof makeSquadState>[]): GameState {
  return {
    tick: 0,
    seed: 42,
    simTimeMs: 0,
    missionIndex: 0,
    squads,
    baseStorage: [],
    eventLog: [],
    lastReport: null,
    mapNodes: MAP_NODES,
    missionPool: [],
  }
}

describe('drawMap', () => {
  it('highlights mission target node when squad is InMission', () => {
    const squad = makeSquadState('InMission', 'target-1', 280, 120)
    const state = makeState([squad])

    const ctx = makeMockCtx()
    drawMap(ctx as unknown as CanvasRenderingContext2D, state, 800, 500)

    const highlighted = ctx.arcCalls.filter((c) => Math.round(c.r * 100) / 100 === 10).length
    expect(highlighted).toBeGreaterThanOrEqual(1)
  })

  it('does NOT highlight mission target node when squad is Returning', () => {
    const squad = makeSquadState('Returning', 'target-1', 280, 120)
    const state = makeState([squad])

    const ctx = makeMockCtx()
    drawMap(ctx as unknown as CanvasRenderingContext2D, state, 800, 500)

    const highlighted = ctx.arcCalls.filter((c) => Math.round(c.r * 100) / 100 === 10).length
    expect(highlighted).toBe(0)
  })

  it('does NOT highlight mission target node when squad is MissionReport', () => {
    const squad = makeSquadState('MissionReport', 'target-1', 280, 120)
    const state = makeState([squad])

    const ctx = makeMockCtx()
    drawMap(ctx as unknown as CanvasRenderingContext2D, state, 800, 500)

    const highlighted = ctx.arcCalls.filter((c) => Math.round(c.r * 100) / 100 === 10).length
    expect(highlighted).toBe(0)
  })
})
