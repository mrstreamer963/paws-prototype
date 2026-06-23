import { useGameLoop } from './hooks/useGameLoop'
import { AppShell } from './components/AppShell'

export default function App() {
  const { state, isPlaying, speed, setPlaying, cycleSpeed } = useGameLoop()
  return <AppShell state={state} isPlaying={isPlaying} speed={speed} setPlaying={setPlaying} cycleSpeed={cycleSpeed} />
}
