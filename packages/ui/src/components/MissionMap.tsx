import type { GameState } from '@paws/core'
import { useEffect, useRef } from 'react'
import { drawMap } from '../canvas/drawMap'
import { MissionReportModal } from './MissionReportModal'
import { PhaseBanner } from './PhaseBanner'

interface Props {
  state: GameState
}

export function MissionMap({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const render = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawMap(ctx, state, rect.width * dpr, rect.height * dpr)
    }

    render()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(render)
      ro.observe(wrap)
      return () => ro.disconnect()
    }
    window.addEventListener('resize', render)
    return () => window.removeEventListener('resize', render)
  }, [state])

  return (
    <div className="map-panel">
      <div className="map-tabs">
        <button type="button" className="active">
          MAP
        </button>
        <button type="button" disabled>
          INTEL
        </button>
        <button type="button" disabled>
          FACTIONS
        </button>
      </div>
      <div className="map-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} />
        <PhaseBanner state={state} />
        {/* <MissionReportModal state={state} /> */}
      </div>
    </div>
  )
}
