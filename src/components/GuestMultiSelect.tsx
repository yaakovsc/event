import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useGuestStore } from '../store/guestStore'

interface GuestMultiSelectProps {
  value: string[]
  onChange: (ids: string[]) => void
  excludeId?: string
  placeholder?: string
}

export function GuestMultiSelect({
  value,
  onChange,
  excludeId,
  placeholder = 'בחר אורחים...',
}: GuestMultiSelectProps) {
  const guests = useGuestStore((s) => s.guests)
  const available = guests.filter((g) => g.id !== excludeId)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = available.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.group.toLowerCase().includes(search.toLowerCase())
  )

  const selected = available.filter((g) => value.includes(g.id))

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <div className="relative" ref={ref}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selected.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
            >
              {g.name}
              <button
                type="button"
                onClick={() => toggle(g.id)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm bg-background border border-input rounded-md hover:border-ring transition-colors"
      >
        <span className="text-muted-foreground text-xs">{placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-[60] bg-card border border-border rounded-md shadow-xl max-h-52 flex flex-col">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2 text-center">לא נמצאו</p>
            ) : (
              filtered.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(g.id)}
                    onChange={() => toggle(g.id)}
                    className="accent-primary flex-shrink-0"
                  />
                  <span className="text-sm text-foreground truncate">{g.name}</span>
                  {g.group && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">({g.group})</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
