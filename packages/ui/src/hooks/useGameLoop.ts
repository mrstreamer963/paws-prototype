import { createGame, type GameState } from '@paws/core'
import { useCallback, useEffect, useRef, useState } from 'react'

const SPEEDS = [1, 2, 5] as const

export function useGameLoop(): { state: GameState; isPlaying: boolean; speed: number; setPlaying: (v: boolean) => void; cycleSpeed: () => void } {
  const gameRef = useRef(createGame({ seed: 42 }))
  const [state, setState] = useState(() => gameRef.current.getState())

  const setPlaying = useCallback((v: boolean) => {
    gameRef.current.setPlaying(v)
  }, [])

  const cycleSpeed = useCallback(() => {
    const cur = gameRef.current.speed as 1 | 2 | 5
    const idx = SPEEDS.indexOf(cur)
    const next = SPEEDS[(idx + 1) % SPEEDS.length] as 1 | 2 | 5
    gameRef.current.setSpeed(next)
    setState(gameRef.current.getState())
  }, [])

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

  if (state.tick > 0 && state.tick % 500 === 0) {
    const squadInfo = state.squads.map(s => ({
      id: s.id,
      phase: s.phase,
      cargo: s.cargo.filter(c => c.qty > 0),
      readiness: Math.round(s.readiness),
    }))
    console.log('tick:', state.tick,
      'baseStorage:', state.baseStorage.filter(s => s.qty > 0),
      'squads:', squadInfo
    )
  }
  return { state, isPlaying: gameRef.current.isPlaying, speed: gameRef.current.speed, setPlaying, cycleSpeed }
}
