import { type ReactNode, useState } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function CollapsiblePanel({ title, defaultOpen = true, children, className = '' }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`border-b border-border ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold tracking-widest text-muted uppercase hover:text-accent transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pb-3">
          {children}
        </div>
      </div>
    </div>
  )
}