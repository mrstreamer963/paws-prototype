interface Props {
  isPlaying: boolean
  speed: number
  onPlayPause: () => void
  onCycleSpeed: () => void
}

export function TransportControls({ isPlaying, speed, onPlayPause, onCycleSpeed }: Props) {
  return (
    <div className="transport-controls">
      <button
        type="button"
        className="transport-controls__btn"
        onClick={onPlayPause}
        title={isPlaying ? 'Пауза' : 'Играть'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button
        type="button"
        className="transport-controls__btn transport-controls__btn--speed"
        onClick={onCycleSpeed}
        title='Скорость'
      >
        {speed}×
      </button>
    </div>
  )
}
