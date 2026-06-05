import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Trash2, Pencil, Users, SlidersHorizontal } from 'lucide-react'
import { cn } from '../utils/cn'
import { useGuestStore } from '../store/guestStore'
import { useRulesStore } from '../store/rulesStore'
import { RulesDialog } from '../dialogs/RulesDialog'
import type { Guest } from '../types'

interface GuestCardProps {
  guest: Guest
  onEdit: (guest: Guest) => void
}

export function GuestCard({ guest, onEdit }: GuestCardProps) {
  const deleteGuest = useGuestStore((s) => s.deleteGuest)
  const hasRule = useRulesStore((s) => {
    const r = s.rules[guest.id]
    if (!r) return false
    return r.parents.length + r.children.length + r.bestFriends.length +
           r.doNotSeatWith.length + r.workRelations.length + r.sameBuilding.length > 0 ||
           r.synagogue || r.buildingName || r.isElderly || r.isYoung ||
           r.notes || r.customQuestions.length > 0
  })
  const [rulesOpen, setRulesOpen] = useState(false)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { guestId: guest.id },
  })


  return (
    <>
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-3 shadow-sm transition-all duration-150',
        'hover:shadow-md hover:border-primary/30',
        isDragging && 'opacity-50 scale-95 shadow-lg'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          title="גרור לשיבוץ בשולחן"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{guest.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {guest.group}{guest.side && guest.group ? ' · ' : ''}{guest.side}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
              <Users className="w-3 h-3" />
              {guest.noOfGuests}
            </span>

            {guest.tableNo !== null ? (
              <span className="inline-flex items-center text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                שולחן {guest.tableNo}
              </span>
            ) : (
              <span className="inline-flex items-center text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                לא משובץ
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(guest)}
            className="p-1 text-muted-foreground hover:text-primary transition-colors rounded"
            title="ערוך אורח"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRulesOpen(true)}
            className={cn(
              'p-1 transition-colors rounded',
              hasRule ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
            title="חוקי ישיבה"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteGuest(guest.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
            title="מחק אורח"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
    <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} guest={guest} />
    </>
  )
}
