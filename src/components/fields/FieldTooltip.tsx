import { useEffect, useRef, useState } from 'react'

export interface FieldTooltipProps {
  text: string
}

export function FieldTooltip({ text }: FieldTooltipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <span
      ref={containerRef}
      className="field-tooltip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`field-tooltip__trigger${open ? ' field-tooltip__trigger--active' : ''}`}
        aria-label="Info"
        aria-expanded={open}
        onMouseDown={(event) => {
          // Prevent label click from stealing focus to input
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
      >
        ?
      </button>
      {open && (
        <span className="field-tooltip__bubble" role="tooltip">
          {text}
        </span>
      )}
    </span>
  )
}
