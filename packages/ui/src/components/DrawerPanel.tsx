import { type ReactNode, useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  side?: 'left' | 'right'
}

export function DrawerPanel({ open, onClose, title, children, side = 'right' }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const sideClass = side === 'right' ? 'right-0' : 'left-0'
  const translateClass = side === 'right'
    ? (open ? 'translate-x-0' : 'translate-x-full')
    : (open ? 'translate-x-0' : '-translate-x-full')

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 ${sideClass} h-full w-80 max-w-[90vw] bg-panel border-l border-border z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${translateClass}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold tracking-widest text-accent uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors cursor-pointer text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  )
}