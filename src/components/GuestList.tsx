import { useState, useMemo } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { useGuestStore } from '../store/guestStore'
import { GuestCard } from './GuestCard'
import { cn } from '../utils/cn'
import type { Guest } from '../types'

interface GuestListProps {
  onEditGuest: (guest: Guest) => void
  onAddGuest: () => void
}

export function GuestList({ onEditGuest, onAddGuest }: GuestListProps) {
  const guests = useGuestStore((s) => s.guests)
  const [search, setSearch] = useState('')
  const [unassignedOnly, setUnassignedOnly] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedSide, setSelectedSide] = useState('')

  const groups = useMemo(() => {
    const vals = [...new Set(guests.map((g) => g.group).filter(Boolean))].sort()
    return vals
  }, [guests])

  const sides = useMemo(() => {
    const vals = [...new Set(guests.map((g) => g.side).filter(Boolean))].sort()
    return vals
  }, [guests])

  const filtered = guests.filter((g) => {
    const matchesSearch =
      search === '' ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.group.toLowerCase().includes(search.toLowerCase()) ||
      g.side.toLowerCase().includes(search.toLowerCase())
    const matchesUnassigned = !unassignedOnly || g.tableNo === null
    const matchesGroup = selectedGroup === '' || g.group === selectedGroup
    const matchesSide = selectedSide === '' || g.side === selectedSide
    return matchesSearch && matchesUnassigned && matchesGroup && matchesSide
  })

  const unassignedCount = guests.filter((g) => g.tableNo === null).length
  const hasActiveFilters = selectedGroup !== '' || selectedSide !== ''

  const clearFilters = () => {
    setSelectedGroup('')
    setSelectedSide('')
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="p-3 border-b border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">אורחים</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {filtered.length}/{guests.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="חיפוש אורחים..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Group filter */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(selectedGroup === g ? '' : g)}
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full border transition-colors',
                  selectedGroup === g
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                )}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Side filter */}
        {sides.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sides.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSide(selectedSide === s ? '' : s)}
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full border transition-colors',
                  selectedSide === s
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-muted text-muted-foreground border-border hover:border-blue-400/50'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Unassigned + clear filters row */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unassignedOnly}
              onChange={(e) => setUnassignedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary"
            />
            <span className="text-xs text-foreground">
              לא משובצים
              {unassignedCount > 0 && (
                <span className="mr-1 text-yellow-600 dark:text-yellow-400 font-medium">
                  ({unassignedCount})
                </span>
              )}
            </span>
          </label>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
              נקה
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">לא נמצאו אורחים</p>
            {(search || hasActiveFilters) && (
              <button
                onClick={() => { setSearch(''); clearFilters() }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                נקה חיפוש
              </button>
            )}
          </div>
        ) : (
          filtered.map((guest) => (
            <GuestCard key={guest.id} guest={guest} onEdit={onEditGuest} />
          ))
        )}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={onAddGuest}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          הוסף אורח
        </button>
      </div>
    </div>
  )
}
