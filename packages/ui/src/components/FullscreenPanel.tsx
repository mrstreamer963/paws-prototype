import { type ReactNode, useEffect, useState } from 'react'

interface Props {
  title: string
  children: ReactNode
  className?: string
}

export function FullscreenPanel({ title, children, className = '' }: Props) {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    if (fullscreen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [fullscreen])

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-bg flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel">
          <h2 className="text-sm font-bold tracking-widest text-accent uppercase">{title}</h2>
          <button
            onClick={() => setFullscreen(false)}
            className="text-muted hover:text-text transition-colors cursor-pointer text-lg leading-none"
            aria-label="Exit fullscreen"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      {children}
      <button
        onClick={() => setFullscreen(true)}
        className="absolute top-2 right-2 z-10 text-muted hover:text-accent transition-colors cursor-pointer text-xs bg-panel/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100"
        aria-label="Fullscreen"
        title="Fullscreen"
      >
        ⛶
      </button>
    </div>
  )
}