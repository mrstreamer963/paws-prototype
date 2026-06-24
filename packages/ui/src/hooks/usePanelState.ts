import { useState, useCallback } from 'react'

interface PanelState {
  leftOpen: boolean
  rightOpen: boolean
}

export function usePanelState() {
  const [state, setState] = useState<PanelState>({ leftOpen: true, rightOpen: true })

  const toggleLeft = useCallback(() => setState(s => ({ ...s, leftOpen: !s.leftOpen })), [])
  const toggleRight = useCallback(() => setState(s => ({ ...s, rightOpen: !s.rightOpen })), [])

  return { ...state, toggleLeft, toggleRight }
}