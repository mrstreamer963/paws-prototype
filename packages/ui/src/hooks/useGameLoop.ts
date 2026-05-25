import { createGame, type GameState } from '@paws/core'
import { useEffect, useRef, useState } from 'react'

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

  // DEBUG
  if (state.tick > 0 && state.tick % 100 === 0) {
    console.log('tick:', state.tick, 'squads:', state.squads.length, state.squads.map(s => ({ id: s.id, phase: s.phase })))
  }
  return state
}
